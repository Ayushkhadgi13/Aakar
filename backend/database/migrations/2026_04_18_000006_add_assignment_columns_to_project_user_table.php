<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_user', function (Blueprint $table) {
            if (!Schema::hasColumn('project_user', 'assigned_at')) {
                $table->timestamp('assigned_at')->nullable()->after('user_id');
            }

            if (!Schema::hasColumn('project_user', 'assigned_by')) {
                $table->foreignId('assigned_by')->nullable()->after('assigned_at')->constrained('users')->nullOnDelete();
            }
        });

        DB::table('project_user')
            ->whereNull('assigned_at')
            ->update([
                'assigned_at' => DB::raw('COALESCE(created_at, CURRENT_TIMESTAMP)'),
            ]);

        try {
            Schema::table('project_user', function (Blueprint $table) {
                $table->unique(['project_id', 'user_id']);
            });
        } catch (\Throwable $exception) {
            // Ignore if the index already exists or the database engine can't add it cleanly.
        }
    }

    public function down(): void
    {
        try {
            Schema::table('project_user', function (Blueprint $table) {
                $table->dropUnique(['project_id', 'user_id']);
            });
        } catch (\Throwable $exception) {
            // Ignore if the index does not exist.
        }

        Schema::table('project_user', function (Blueprint $table) {
            if (Schema::hasColumn('project_user', 'assigned_by')) {
                $table->dropForeign(['assigned_by']);
                $table->dropColumn('assigned_by');
            }

            if (Schema::hasColumn('project_user', 'assigned_at')) {
                $table->dropColumn('assigned_at');
            }
        });
    }
};
