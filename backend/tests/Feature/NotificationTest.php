<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_ut_39_fetch_unread_notifications()
    {
        $user = User::factory()->create();
        
        // Use Laravel's Notification Facade to send a test notification
        $user->notify(new \App\Notifications\TaskCompleted(new \App\Models\Task(['title' => 'Test Task']), 'System'));

        $response = $this->actingAs($user)->getJson('/api/notifications');

        $response->assertStatus(200)
                 ->assertJsonCount(1); // Ensure it's in the unread list
    }

    public function test_ut_40_mark_single_notification_as_read()
    {
        $user = User::factory()->create();
        $user->notify(new \App\Notifications\TaskCompleted(new \App\Models\Task(['title' => 'Test Task']), 'System'));
        
        $notif = $user->unreadNotifications->first();

        $response = $this->actingAs($user)->patchJson("/api/notifications/{$notif->id}/read");

        $response->assertStatus(200);
        $this->assertEquals(0, $user->fresh()->unreadNotifications->count());
    }

    public function test_ut_41_mark_all_notifications_as_read()
    {
        $user = User::factory()->create();
        $user->notify(new \App\Notifications\TaskCompleted(new \App\Models\Task(['title' => 'T1']), 'System'));
        $user->notify(new \App\Notifications\TaskCompleted(new \App\Models\Task(['title' => 'T2']), 'System'));

        $response = $this->actingAs($user)->patchJson('/api/notifications/read-all');

        $response->assertStatus(200);
        $this->assertEquals(0, $user->fresh()->unreadNotifications->count());
    }
}