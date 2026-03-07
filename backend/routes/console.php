<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Transaction;
use App\Models\MonthlyReport;
use App\Models\Project;
use App\Models\User;
use App\Notifications\ProjectStarted;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * AUTOMATIC MONTHLY REPORT GENERATOR
 */
Schedule::call(function () {
    $lastMonth = Carbon::now()->subMonth();
    $year = $lastMonth->year;
    $monthNum = $lastMonth->month;
    $reportTitle = $lastMonth->format('F Y');

    if (MonthlyReport::where('year', $year)->where('month_number', $monthNum)->exists()) {
        return;
    }

    $income = Transaction::whereYear('date', $year)->whereMonth('date', $monthNum)->where('type', 'income')->sum('amount');
    $expense = Transaction::whereYear('date', $year)->whereMonth('date', $monthNum)->where('type', 'expense')->sum('amount');
    $count = Transaction::whereYear('date', $year)->whereMonth('date', $monthNum)->count();
    
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

/**
 * AUTOMATIC PROJECT STATUS UPDATE
 * Moves 'Upcoming' projects to 'In Progress' if start_date arrived.
 * Sends notification to Admins.
 */
Schedule::call(function () {
    $today = Carbon::now()->toDateString();

    $projectsToStart = Project::where('status', 'Upcoming')
                              ->whereDate('start_date', '<=', $today)
                              ->get();

    if ($projectsToStart->isNotEmpty()) {
        $admins = User::where('role', 'admin')->get();

        foreach ($projectsToStart as $project) {
            $project->update(['status' => 'In Progress']);
            
            // Send Notification to Admins
            Notification::send($admins, new ProjectStarted($project));
        }
    }
})->dailyAt('00:01'); 
