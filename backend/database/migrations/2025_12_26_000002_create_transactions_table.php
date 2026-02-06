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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            // UPDATE THIS LINE: Added 'pre-payment' to the list
            $table->enum('type', ['income', 'expense', 'pre-payment']); 
            $table->decimal('amount', 15, 2);
            $table->string('category');
            $table->date('date');
            $table->text('description')->nullable();
            
            // Link to the vendors table
            $table->foreignId('vendor_id')
                  ->nullable()
                  ->constrained('vendors')
                  ->onDelete('set null');
                  
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};