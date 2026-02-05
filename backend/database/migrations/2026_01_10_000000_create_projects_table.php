<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('client_name');
            $table->string('location')->nullable();
            $table->decimal('budget', 15, 2);
            $table->enum('status', ['Upcoming', 'In Progress', 'On Hold', 'Completed'])->default('Upcoming');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('progress')->default(0); // 0 to 100
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('projects');
    }
};