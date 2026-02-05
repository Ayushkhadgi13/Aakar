<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role');
            $table->decimal('salary_amount', 15, 2);
            $table->date('join_date');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('employees');
    }
};