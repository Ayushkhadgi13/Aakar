<?php

namespace Tests\Feature;

use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;
use Carbon\Carbon;

class ConsoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_ut_42_generate_monthly_reports_command()
    {
        // 1. Create a transaction for last month
        $lastMonth = Carbon::now()->subMonthNoOverflow();
        
        Transaction::create([
            'type' => 'income',
            'amount' => 5000,
            'category' => 'Consulting',
            'date' => $lastMonth->format('Y-m-d')
        ]);

        Transaction::create([
            'type' => 'expense',
            'amount' => 2000,
            'category' => 'Materials',
            'date' => $lastMonth->format('Y-m-d')
        ]);

        // 2. Run the artisan command manually
        Artisan::call('reports:generate-monthly');

        // 3. Verify the report exists in the monthly_reports table
        $this->assertDatabaseHas('monthly_reports', [
            'year' => $lastMonth->year,
            'month_number' => $lastMonth->month,
            'income' => 5000,
            'expense' => 2000,
            'balance' => 3000,
            'transaction_count' => 2
        ]);
    }
}