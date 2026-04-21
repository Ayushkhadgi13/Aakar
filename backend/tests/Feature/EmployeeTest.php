<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    public function test_ut_06_admin_can_create_an_employee_with_payroll()
    {
        // 1. Create a user with the 'admin' role
        $admin = User::factory()->create([
            'role' => 'admin'
        ]);

        // 2. Act as the admin and send a POST request to create an employee
        $response = $this->actingAs($admin)->postJson('/api/system/employees', [
            'name' => 'Site Manager',
            'email' => 'manager@aakar.com',
            'dob' => '1990-05-15', // Used as the initial password
            'role' => 'manager',
            'salary' => 55000
        ]);

        // 3. Assert success and check the JSON structure returned
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'message',
                     'user' => ['id', 'name', 'email', 'role'],
                     'payroll_entry' => ['id', 'name', 'role', 'salary_amount']
                 ]);

        // 4. Assert the new User login was created
        $this->assertDatabaseHas('users', [
            'email' => 'manager@aakar.com',
            'role' => 'manager'
        ]);

        // 5. Assert the Payroll Employee record was created
        $this->assertDatabaseHas('employees', [
            'name' => 'Site Manager',
            'role' => 'manager',
            'salary_amount' => 55000
        ]);
    }

    public function test_ut_07_standard_user_cannot_create_an_employee()
    {
        // 1. Create a standard user (role = 'user')
        $standardUser = User::factory()->create([
            'role' => 'user'
        ]);

        // 2. Act as the standard user and try to create an employee
        $response = $this->actingAs($standardUser)->postJson('/api/system/employees', [
            'name' => 'Hacker User',
            'email' => 'hacker@aakar.com',
            'dob' => '1995-01-01',
            'role' => 'admin',
            'salary' => 100000
        ]);

        // 3. Assert they are blocked with a 403 Forbidden error
        $response->assertStatus(403)
                 ->assertJson([
                     'message' => 'Unauthorized'
                 ]);

        // 4. Double check the hacker was NOT created in the database
        $this->assertDatabaseMissing('users', [
            'email' => 'hacker@aakar.com'
        ]);
    }
}