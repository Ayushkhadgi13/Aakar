<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Transaction;
use App\Models\MonthlyReport;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * AUTOMATIC MONTHLY REPORT GENERATOR
 * Runs on the 1st of every month to archive the previous month's data.
 */
Schedule::call(function () {
    $lastMonth = Carbon::now()->subMonth();
    $year = $lastMonth->year;
    $monthNum = $lastMonth->month;
    $reportTitle = $lastMonth->format('F Y');

    // Prevent duplicate reports if command is run twice
    if (MonthlyReport::where('year', $year)->where('month_number', $monthNum)->exists()) {
        return;
    }

    $income = Transaction::whereYear('date', $year)->whereMonth('date', $monthNum)->where('type', 'income')->sum('amount');
    $expense = Transaction::whereYear('date', $year)->whereMonth('date', $monthNum)->where('type', 'expense')->sum('amount');
    $count = Transaction::whereYear('date', $year)->whereMonth('date', $monthNum)->count();
    
    // Find the category with the highest spending for that month
    $topCat = Transaction::whereYear('date', $year)
        ->whereMonth('date', $monthNum)
        ->where('type', 'expense')
        ->select('category', DB::raw('SUM(amount) as total'))
        ->groupBy('category')
        ->orderBy('total', 'desc')
        ->first();

    MonthlyReport::create([
        'report_month' => $reportTitle,
        'year' => $year,
        'month_number' => $monthNum,
        'total_income' => $income,
        'total_expense' => $expense,
        'net_balance' => $income - $expense,
        'top_expense_category' => $topCat ? $topCat->category : 'N/A',
        'transaction_count' => $count
    ]);
})->monthlyOn(1, '00:00');