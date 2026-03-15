<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_documents', function (Blueprint $table) {
            $table->string('status')->default('approved')->after('file_path');
            // Default is 'approved' so existing documents are unaffected.
            // BOQ files uploaded going forward will be set to 'pending'.
        });
    }

    public function down(): void
    {
        Schema::table('project_documents', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};