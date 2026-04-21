<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_ut_23_admin_can_create_task_with_pending_status()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);
        
        $project = Project::create([
            'name' => 'Task Project', 'client_name' => 'Client', 
            'budget' => 50000, 'start_date' => '2025-01-01'
        ]);

        // Link the user to the project so the validation passes
        $project->users()->attach($user->id);

        $response = $this->actingAs($admin)->postJson('/api/tasks', [
            'title' => 'Site Inspection',
            'description' => 'Check foundation work',
            'project_id' => $project->id,
            'assigned_to' => $user->id,
            'due_date' => '2025-02-01'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tasks', [
            'title' => 'Site Inspection',
            'status' => 'Pending',
            'assigned_to' => $user->id
        ]);
    }
    public function test_ut_24_task_creation_fails_if_assignee_not_in_project()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $randomUser = User::factory()->create(['role' => 'user']);
        
        // Create a project but don't add the random user to it
        $project = Project::create([
            'name' => 'Restricted Project', 'client_name' => 'Client', 
            'budget' => 50000, 'start_date' => '2025-01-01'
        ]);

        // Attempt to assign to user who is NOT a project member
        $response = $this->actingAs($admin)->postJson('/api/tasks', [
            'title' => 'Invalid Task',
            'description' => 'Should fail',
            'project_id' => $project->id,
            'assigned_to' => $randomUser->id,
            'due_date' => '2025-02-01'
        ]);

        // Assert 422 Unprocessable Entity
        $response->assertStatus(422)
                 ->assertJson([
                     'message' => 'Assignee must be a member of the selected project.'
                 ]);
    }
    public function test_ut_25_task_completion_notifies_creator()
    {
        $admin = User::factory()->create(['role' => 'admin']); // The Creator
        $user = User::factory()->create(['role' => 'user']);   // The Assignee
        
        $project = Project::create([
            'name' => 'Notification Project', 'client_name' => 'Client', 
            'budget' => 50000, 'start_date' => '2025-01-01'
        ]);
        
        // Create the task in the DB
        $task = \App\Models\Task::create([
            'title' => 'Sample Task',
            'project_id' => $project->id,
            'assigned_to' => $user->id,
            'assigned_by' => $admin->id,
            'status' => 'Pending',
            'due_date' => '2025-02-01'
        ]);

        // Act as the User (the assignee) to complete the task
        $response = $this->actingAs($user)->putJson("/api/tasks/{$task->id}", [
            'status' => 'Completed'
        ]);

        $response->assertStatus(200);

        // Verify that the Admin (Creator) received the notification
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $admin->id,
            'type' => 'App\Notifications\TaskCompleted',
            'data' => json_encode([
                'title' => 'Task Completed',
                'message' => "{$user->name} has completed the task: \"Sample Task\".",
                'task_id' => $task->id
            ])
        ]);
    }
    public function test_ut_26_user_can_only_fetch_their_assigned_tasks()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $userA = User::factory()->create(['role' => 'user']);
        $userB = User::factory()->create(['role' => 'user']);
        
        $project = Project::create([
            'name' => 'Scope Project', 'client_name' => 'Client', 
            'budget' => 50000, 'start_date' => '2025-01-01'
        ]);

        // Create a task for User A
        \App\Models\Task::create([
            'title' => 'Task for A', 'project_id' => $project->id,
            'assigned_to' => $userA->id, 'assigned_by' => $admin->id,
            'status' => 'Pending', 'due_date' => '2025-02-01'
        ]);

        // Create a task for User B
        \App\Models\Task::create([
            'title' => 'Task for B', 'project_id' => $project->id,
            'assigned_to' => $userB->id, 'assigned_by' => $admin->id,
            'status' => 'Pending', 'due_date' => '2025-02-01'
        ]);

        // Act as User A and fetch tasks
        $response = $this->actingAs($userA)->getJson('/api/tasks');

        $response->assertStatus(200);
        
        // Assert User A sees their task
        $response->assertJsonPath('my_tasks.0.title', 'Task for A');
        
        // Assert User A does NOT see User B's task (count should be 1)
        $this->assertCount(1, $response->json('my_tasks'));
    }
    public function test_ut_27_28_transaction_math_income_and_expense()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        // 1. Record an Income transaction (e.g., Client Payment)
        $this->actingAs($admin)->postJson('/api/finance/transactions', [
            'type' => 'income', 
            'amount' => 1000, 
            'category' => 'Client Payment', 
            'date' => '2025-01-01'
        ]);

        // 2. Record an Expense transaction (e.g., Labor cost)
        $this->actingAs($admin)->postJson('/api/finance/transactions', [
            'type' => 'expense', 
            'amount' => 300, 
            'category' => 'Labor', 
            'date' => '2025-01-01'
        ]);

        // 3. Fetch summary and verify the balance logic: 1000 - 300 = 700
        $response = $this->actingAs($admin)->getJson('/api/finance/summary');
        
        $response->assertStatus(200)
                 ->assertJson([
                     'total_income' => 1000.0,
                     'total_expense' => 300.0,
                     'total_balance' => 700.0
                 ]);
    }
    
}