<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectDocument;
use App\Models\User;
use App\Jobs\ParseBOQDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class FinanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_ut_20_boq_upload_dispatches_parse_job()
    {
        Queue::fake(); // We fake the queue so we don't actually run the job yet
        $user = User::factory()->create(['role' => 'admin']);
        $project = Project::create([
            'name' => 'Test Project', 'client_name' => 'Client', 
            'budget' => 50000, 'start_date' => '2025-01-01'
        ]);
        Storage::fake('public');

        $file = UploadedFile::fake()->create('boq.xlsx', 500);

        $response = $this->actingAs($user)->postJson("/api/projects/{$project->id}/documents", [
            'file' => $file,
            'type' => 'BOQ'
        ]);

        $response->assertStatus(200);
        
        // Assert the job was dispatched to the queue
        Queue::assertPushed(ParseBOQDocument::class);
    }
    public function test_ut_21_manually_storing_material_estimate()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create([
            'name' => 'Estimate Test', 'client_name' => 'Client', 
            'budget' => 50000, 'start_date' => '2025-01-01'
        ]);

        $response = $this->actingAs($admin)->postJson("/api/projects/{$project->id}/estimates", [
            'material_name' => 'Steel Rods',
            'estimated_quantity' => 500,
            'estimated_unit_price' => 120,
            'unit' => 'kg'
        ]);

        $response->assertStatus(201); // 201 Created

        // Verify the record exists in the project_material_estimates table
        $this->assertDatabaseHas('project_material_estimates', [
            'project_id' => $project->id,
            'material_name' => 'Steel Rods',
            'estimated_quantity' => 500
        ]);
    }
    public function test_ut_22_boq_analysis_variance_calculation()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create([
            'name' => 'Variance Test Project', 'client_name' => 'Client', 
            'budget' => 50000, 'start_date' => '2025-01-01'
        ]);

        // 1. Create an estimate (100 bags of Cement at 500 each = 50,000 total)
        \App\Models\ProjectMaterialEstimate::create([
            'project_id' => $project->id,
            'material_name' => 'Cement',
            'estimated_quantity' => 100,
            'estimated_unit_price' => 500,
            'unit' => 'bags'
        ]);

        // 2. Create a Vendor and actual purchase (50 bags at 600 each = 30,000 total)
        $vendor = \App\Models\Vendor::create(['name' => 'Supplier', 'project_id' => $project->id]);
        \App\Models\VendorMaterial::create([
            'vendor_id' => $vendor->id,
            'material_name' => 'Cement',
            'unit_price' => 600,
            'quantity' => 50,
            'total_price' => 30000
        ]);

        // 3. Test the analysis endpoint
        $response = $this->actingAs($admin)->getJson("/api/projects/{$project->id}/boq");

        // 4. Check if the analysis calculation is correct
        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'material' => 'Cement',
                     'est_total' => 50000,
                     'act_total' => 30000
                 ]);
    }
    public function test_ut_29_category_breakdown_aggregation()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        // Create two separate expenses under the SAME category "Materials"
        $this->actingAs($admin)->postJson('/api/finance/transactions', [
            'type' => 'expense', 'amount' => 500, 'category' => 'Materials', 'date' => '2025-01-01'
        ]);
        $this->actingAs($admin)->postJson('/api/finance/transactions', [
            'type' => 'expense', 'amount' => 200, 'category' => 'Materials', 'date' => '2025-01-02'
        ]);

        // Create one expense under a different category "Labor"
        $this->actingAs($admin)->postJson('/api/finance/transactions', [
            'type' => 'expense', 'amount' => 100, 'category' => 'Labor', 'date' => '2025-01-03'
        ]);

        $response = $this->actingAs($admin)->getJson('/api/finance/summary');

        // Check if the endpoint correctly grouped "Materials" (700) and "Labor" (100)
        $response->assertStatus(200)
                 ->assertJsonFragment(['category' => 'Materials', 'total' => 700])
                 ->assertJsonFragment(['category' => 'Labor', 'total' => 100]);
    }
    public function test_ut_30_observer_triggers_budget_overrun_notification()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create([
            'name' => 'Budget Project', 'client_name' => 'Client', 
            'budget' => 1000, 'start_date' => '2025-01-01'
        ]);

        // Add an expense of 1001 (Over budget)
        $this->actingAs($admin)->postJson('/api/finance/transactions', [
            'type' => 'expense', 
            'amount' => 1001, 
            'category' => 'Materials', 
            'date' => '2025-01-01',
            'project_id' => $project->id
        ]);

        // Verify the notification was sent to the admin
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $admin->id,
            'type' => 'App\Notifications\BudgetOverrun'
        ]);
    }

    public function test_ut_31_observer_debounces_notifications_for_24h()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create([
            'name' => 'Budget Project', 'client_name' => 'Client', 
            'budget' => 1000, 'start_date' => '2025-01-01'
        ]);

        // 1. Trigger first notification
        $this->actingAs($admin)->postJson('/api/finance/transactions', [
            'type' => 'expense', 'amount' => 1100, 'category' => 'Materials', 'date' => '2025-01-01',
            'project_id' => $project->id
        ]);

        // 2. Trigger second notification immediately (should be blocked by 24h debounce)
        $this->actingAs($admin)->postJson('/api/finance/transactions', [
            'type' => 'expense', 'amount' => 1200, 'category' => 'Materials', 'date' => '2025-01-01',
            'project_id' => $project->id
        ]);

        // We count how many notifications were sent. 
        // If logic is correct, it should still be 1 because of the debounce logic in TransactionObserver.
        $count = \App\Models\User::find($admin->id)->notifications()->count();
        $this->assertEquals(1, $count);
    }
    public function test_ut_32_vendors_create_success()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create([
            'name' => 'Finance Test Project', 'client_name' => 'Client', 
            'budget' => 50000, 'start_date' => '2025-01-01'
        ]);

        $response = $this->actingAs($admin)->postJson('/api/finance/vendors', [
            'name' => 'Global Supplies',
            'project_id' => $project->id,
            'contact_person' => 'John Doe',
            'phone' => '1234567890',
            'materials' => [
                ['material_name' => 'Cement', 'unit_price' => 500, 'quantity' => 10]
            ]
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('vendors', ['name' => 'Global Supplies']);
        $this->assertDatabaseHas('vendor_materials', ['material_name' => 'Cement', 'total_price' => 5000]);
    }
    public function test_ut_33_add_material_to_existing_vendor()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create([
            'name' => 'Vendor Material Project',
            'client_name' => 'Client',
            'budget' => 50000,
            'start_date' => '2025-01-01'
        ]);

        // Create a vendor manually first
        $vendor = \App\Models\Vendor::create(['name' => 'Test Vendor', 'project_id' => $project->id]);

        // POST request to the add material endpoint
        $response = $this->actingAs($admin)->postJson("/api/finance/vendors/{$vendor->id}/materials", [
            'material_name' => 'Bricks',
            'unit_price' => 20,
            'quantity' => 100
        ]);

        // Verify the response is 201 (Created)
        $response->assertStatus(201);
        
        // Verify the material record exists in the DB
        $this->assertDatabaseHas('vendor_materials', [
            'vendor_id' => $vendor->id,
            'material_name' => 'Bricks', 
            'total_price' => 2000
        ]);
    }
    public function test_ut_34_payroll_fetch_status()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $emp = \App\Models\Employee::create([
            'name' => 'John Doe', 
            'role' => 'Manager', 
            'salary_amount' => 5000, 
            'join_date' => '2025-01-01'
        ]);

        // GET request to fetch employees
        $response = $this->actingAs($admin)->getJson('/api/finance/employees');
        
        // Assert status 200 and that John Doe's paid_this_month is currently false
        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'name' => 'John Doe', 
                     'paid_this_month' => false
                 ]);
    }
    public function test_ut_35_process_salary_payment_success()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $emp = \App\Models\Employee::create([
            'name' => 'John Doe', 
            'role' => 'Manager', 
            'salary_amount' => 5000, 
            'join_date' => '2025-01-01'
        ]);

        // POST request to process the salary
        $response = $this->actingAs($admin)->postJson("/api/finance/employees/{$emp->id}/pay");

        // Verify response status
        $response->assertStatus(200);

        // Verify the transaction was created in the database
        $this->assertDatabaseHas('transactions', [
            'category' => 'Salary',
            'amount' => 5000,
            'type' => 'expense'
        ]);
    }
    public function test_ut_36_payroll_block_duplicate_payment()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $emp = \App\Models\Employee::create([
            'name' => 'John Doe', 
            'role' => 'Manager', 
            'salary_amount' => 5000, 
            'join_date' => '2025-01-01'
        ]);

        // 1. First payment (Allowed)
        $this->actingAs($admin)->postJson("/api/finance/employees/{$emp->id}/pay");
        
        // 2. Second payment for the same month (Should be blocked by logic in FinanceController)
        $response = $this->actingAs($admin)->postJson("/api/finance/employees/{$emp->id}/pay");
        
        // Assert 422 Unprocessable Entity
        $response->assertStatus(422)
                 ->assertJson(['message' => 'Salary already paid for John Doe this month.']);
    }
    public function test_ut_37_log_material_usage()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create([
            'name' => 'Mat Project', 'client_name' => 'C', 
            'budget' => 10000, 'start_date' => '2025-01-01'
        ]);

        // POST request to log material usage
        $response = $this->actingAs($admin)->postJson('/api/materials/usage', [
            'project_id' => $project->id,
            'material_name' => 'Cement',
            'quantity_used' => 10.5,
            'date' => '2025-01-01'
        ]);

        // Assert 201 Created
        $response->assertStatus(201);
        
        // Assert the record exists in material_usages table
        $this->assertDatabaseHas('material_usages', [
            'material_name' => 'Cement', 
            'quantity_used' => 10.5
        ]);
    }
    public function test_ut_38_inventory_calculation_logic()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create([
            'name' => 'Inv Project', 'client_name' => 'C', 
            'budget' => 10000, 'start_date' => '2025-01-01'
        ]);
        
        // 1. Purchase 100 units from a Vendor
        $vendor = \App\Models\Vendor::create(['name' => 'V', 'project_id' => $project->id]);
        \App\Models\VendorMaterial::create([
            'vendor_id' => $vendor->id, 
            'material_name' => 'Cement', 
            'unit_price' => 10, 
            'quantity' => 100, 
            'total_price' => 1000
        ]);

        // 2. Log usage of 40 units
        \App\Models\MaterialUsage::create([
            'project_id' => $project->id, 
            'material_name' => 'Cement', 
            'quantity_used' => 40, 
            'date' => '2025-01-01', 
            'logged_by' => $admin->id
        ]);

        // 3. GET inventory status
        $response = $this->actingAs($admin)->getJson("/api/projects/{$project->id}/inventory");

        // 4. Verify math: 100 (purchased) - 40 (used) = 60
        $response->assertStatus(200)
                 ->assertJsonFragment(['material_name' => 'Cement', 'current_stock' => 60.0]);
    }
}
