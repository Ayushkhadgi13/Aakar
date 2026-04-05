<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Adds the project_id column. 
            // It is nullable so general expenses don't require a project.
            // nullOnDelete ensures if a project is deleted, the transaction history isn't lost.
            $table->foreignId('project_id')
                  ->nullable()
                  ->constrained('projects')
                  ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Safely removes the relationship and column if you ever rollback
            $table->dropForeign(['project_id']);
            $table->dropColumn('project_id');
        });
    }
};