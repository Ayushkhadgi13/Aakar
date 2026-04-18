<?php

namespace App\Console\Commands;

use App\Models\MonthlyReport;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateMonthlyReports extends Command
{
    protected $signature = 'reports:generate-monthly';

    protected $description = 'Generate or update the previous month financial report';

    public function handle(): int
    {
        $lastMonth = Carbon::now()->subMonthNoOverflow();
        $year = $lastMonth->year;
        $monthNumber = $lastMonth->month;

        $baseQuery = Transaction::query()
            ->whereYear('date', $year)
            ->whereMonth('date', $monthNumber);

        $income = (float) (clone $baseQuery)
            ->where('type', 'income')
            ->sum('amount');

        $expense = (float) (clone $baseQuery)
            ->whereIn('type', ['expense', 'pre-payment'])
            ->sum('amount');

        $topCategory = (clone $baseQuery)
            ->whereIn('type', ['expense', 'pre-payment'])
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->value('category');

        $report = MonthlyReport::updateOrCreate(
            [
                'year' => $year,
                'month_number' => $monthNumber,
            ],
            [
                'report_month' => $lastMonth->format('F Y'),
                'income' => $income,
                'expense' => $expense,
                'balance' => $income - $expense,
                'top_category' => $topCategory ?: 'N/A',
                'transaction_count' => (clone $baseQuery)->count(),
            ]
        );

        $this->info("Monthly report generated for {$report->report_month}.");

        return self::SUCCESS;
    }
}
