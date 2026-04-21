<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    private function validProjectData($overrides = [])
    {
        return array_merge([
            'name' => 'Aakar Test Project',
            'client_name' => 'John Client',
            'location' => 'Kathmandu',
            'budget' => 100000,
            'status' => 'Upcoming',
            'start_date' => '2025-01-01',
            'progress' => 0
        ], $overrides);
    }

    public function test_ut_08_admin_gets_all_projects_user_gets_only_assigned()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $standardUser = User::factory()->create(['role' => 'user']);

        $project1 = Project::create($this->validProjectData(['name' => 'Project 1']));
        $project2 = Project::create($this->validProjectData(['name' => 'Project 2']));
        $project1->users()->attach($standardUser->id);

        $responseAdmin = $this->actingAs($admin)->getJson('/api/projects');
        $responseAdmin->assertStatus(200)->assertJsonCount(2);

        $responseUser = $this->actingAs($standardUser)->getJson('/api/projects');
        $responseUser->assertStatus(200)->assertJsonCount(1);
    }

    public function test_ut_09_project_creation_fails_if_budget_is_zero_or_negative()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $data = $this->validProjectData(['budget' => -5000]);

        $response = $this->actingAs($admin)->postJson('/api/projects', $data);
        $response->assertStatus(422)->assertJsonValidationErrors(['budget']);
    }

    public function test_ut_10_project_progress_can_be_updated()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create($this->validProjectData());

        $response = $this->actingAs($admin)->putJson("/api/projects/{$project->id}", ['progress' => 50]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('projects', ['id' => $project->id, 'progress' => 50]);
    }

    public function test_ut_11_admin_can_delete_a_project()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create($this->validProjectData());

        $response = $this->actingAs($admin)->deleteJson("/api/projects/{$project->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_ut_12_non_admin_cannot_delete_a_project()
    {
        $standardUser = User::factory()->create(['role' => 'user']);
        $project = Project::create($this->validProjectData());

        $response = $this->actingAs($standardUser)->deleteJson("/api/projects/{$project->id}");
        $response->assertStatus(403);
        $this->assertDatabaseHas('projects', ['id' => $project->id]);
    }

    public function test_ut_13_assigning_users_creates_notifications()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);
        $project = Project::create($this->validProjectData());

        $response = $this->actingAs($admin)->postJson("/api/projects/{$project->id}/members", [
            'user_ids' => [$user->id]
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $user->id,
            'type' => 'App\Notifications\ProjectAssigned'
        ]);
    }

    public function test_ut_14_admin_can_remove_member()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $project = Project::create($this->validProjectData());
        $project->users()->attach($user->id);

        $response = $this->actingAs($admin)->deleteJson("/api/projects/{$project->id}/members/{$user->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('project_user', ['project_id' => $project->id, 'user_id' => $user->id]);
    }

    public function test_ut_15_upload_non_boq_document()
    {
        $user = User::factory()->create();
        $project = Project::create($this->validProjectData());
        Storage::fake('public');

        $file = UploadedFile::fake()->create('drawing.pdf', 500);

        $response = $this->actingAs($user)->postJson("/api/projects/{$project->id}/documents", [
            'file' => $file,
            'type' => 'Drawing'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('project_documents', ['file_type' => 'Drawing', 'status' => 'approved']);
    }

    public function test_ut_16_upload_boq_sets_pending_status()
    {
        $user = User::factory()->create();
        $project = Project::create($this->validProjectData());
        Storage::fake('public');

        $file = UploadedFile::fake()->create('budget.xlsx', 500);

        $response = $this->actingAs($user)->postJson("/api/projects/{$project->id}/documents", [
            'file' => $file,
            'type' => 'BOQ'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('project_documents', ['file_type' => 'BOQ', 'status' => 'pending']);
    }

    public function test_ut_17_admin_approve_document_notifies_team()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $project = Project::create($this->validProjectData());
        $project->users()->attach($user->id);

        $doc = ProjectDocument::create([
            'project_id' => $project->id, 'file_type' => 'BOQ', 'original_name' => 'test.xlsx',
            'file_path' => '/storage/path', 'status' => 'pending'
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/documents/{$doc->id}/approve");

        $response->assertStatus(200);
        $this->assertDatabaseHas('project_documents', ['id' => $doc->id, 'status' => 'approved']);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $user->id]);
    }

    public function test_ut_18_admin_reject_document()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create($this->validProjectData());

        $doc = ProjectDocument::create([
            'project_id' => $project->id, 'file_type' => 'BOQ', 'original_name' => 'test.xlsx',
            'file_path' => '/storage/path', 'status' => 'pending'
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/documents/{$doc->id}/reject");

        $response->assertStatus(200);
        $this->assertDatabaseHas('project_documents', ['id' => $doc->id, 'status' => 'rejected']);
    }

    public function test_ut_19_delete_only_allowed_if_rejected()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = Project::create($this->validProjectData());

        $doc = ProjectDocument::create([
            'project_id' => $project->id, 'file_type' => 'BOQ', 'original_name' => 'test.xlsx',
            'file_path' => '/storage/test.xlsx', 'status' => 'approved'
        ]);

        $response = $this->actingAs($admin)->deleteJson("/api/documents/{$doc->id}");
        $response->assertStatus(422);
    }
}