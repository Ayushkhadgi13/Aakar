<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase; 

    public function test_ut_01_user_can_register_successfully()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@aakar.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'access_token',
                     'token_type'
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@aakar.com'
        ]);
    }

    public function test_ut_02_registration_fails_if_email_is_duplicate()
    {
        // 1. Create a user first using Laravel's factory
        User::factory()->create(['email' => 'duplicate@aakar.com']);

        // 2. Try to register a new user with the EXACT SAME email
        $response = $this->postJson('/api/register', [
            'name' => 'Another User',
            'email' => 'duplicate@aakar.com',
            'password' => 'password123'
        ]);

        // 3. Assert it throws a 422 Validation Error specifically for the email field
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_ut_03_user_can_login_with_valid_credentials()
    {
        // 1. Create a fake user in the test database
        $user = User::factory()->create([
            'email' => 'login@aakar.com',
            'password' => bcrypt('correctpassword')
        ]);

        // 2. Attempt to login
        $response = $this->postJson('/api/login', [
            'email' => 'login@aakar.com',
            'password' => 'correctpassword'
        ]);

        // 3. Assert we get a 200 OK and the token/user data
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'access_token',
                     'token_type',
                     'user' => ['id', 'name', 'email']
                 ]);
    }

    public function test_ut_04_login_fails_with_invalid_credentials()
    {
        // 1. Create a user
        User::factory()->create([
            'email' => 'login@aakar.com',
            'password' => bcrypt('correctpassword')
        ]);

        // 2. Attempt login with the WRONG password
        $response = $this->postJson('/api/login', [
            'email' => 'login@aakar.com',
            'password' => 'wrongpassword' // Incorrect!
        ]);

        // 3. Assert it throws a 401 Unauthorized with your exact backend error message
        $response->assertStatus(401)
                 ->assertJson([
                     'message' => 'Invalid login details'
                 ]);
    }

    public function test_ut_05_user_can_logout_successfully()
    {
        // 1. Create a user and manually generate an API token for them
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        // 2. Send a logout request WITH the Bearer token attached
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/logout');

        // 3. Assert 200 OK
        $response->assertStatus(200)
                 ->assertJson([
                     'message' => 'Successfully logged out'
                 ]);

        // 4. Verify the token was actually deleted from the database
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}