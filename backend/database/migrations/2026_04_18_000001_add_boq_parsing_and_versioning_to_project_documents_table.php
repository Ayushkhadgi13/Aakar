<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_documents', function (Blueprint $table) {
            $table->string('parsed_status')->nullable()->after('status');
            $table->unsignedInteger('version')->default(1)->after('parsed_status');
            $table->foreignId('parent_document_id')
                ->nullable()
                ->after('version')
                ->constrained('project_documents')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('project_documents', function (Blueprint $table) {
            $table->dropForeign(['parent_document_id']);
            $table->dropColumn(['parsed_status', 'version', 'parent_document_id']);
        });
    }
};
