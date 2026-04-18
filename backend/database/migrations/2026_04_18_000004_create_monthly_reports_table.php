<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_month');
            $table->unsignedInteger('year');
            $table->unsignedTinyInteger('month_number');
            $table->decimal('income', 15, 2)->default(0);
            $table->decimal('expense', 15, 2)->default(0);
            $table->decimal('balance', 15, 2)->default(0);
            $table->string('top_category')->nullable();
            $table->unsignedInteger('transaction_count')->default(0);
            $table->timestamps();

            $table->unique(['year', 'month_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_reports');
    }
};
