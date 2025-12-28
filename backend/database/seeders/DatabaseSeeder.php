<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Permanent Admin
        User::updateOrCreate(
            ['email' => 'admin@aakar.com'],
            [
                'name' => 'Aakar Admin',
                'password' => Hash::make('admin123'), // Permanent Password
                'role' => 'admin',
                'email_verified_at' => now(), // Pre-verified
            ]
        );

        // Create a Standard Test User
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'role' => 'user',
                'email_verified_at' => now(),
            ]
        );
    }
}