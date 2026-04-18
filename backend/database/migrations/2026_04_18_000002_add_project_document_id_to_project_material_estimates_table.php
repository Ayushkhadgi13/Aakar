<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_material_estimates', function (Blueprint $table) {
            $table->foreignId('project_document_id')
                ->nullable()
                ->after('project_id')
                ->constrained('project_documents')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('project_material_estimates', function (Blueprint $table) {
            $table->dropForeign(['project_document_id']);
            $table->dropColumn('project_document_id');
        });
    }
};
