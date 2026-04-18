<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Project;
use App\Models\User;
use App\Notifications\ProjectStarted;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('reports:generate-monthly')->monthlyOn(1, '00:00');

Schedule::call(function () {
    $today = Carbon::now()->toDateString();

    $projectsToStart = Project::where('status', 'Upcoming')
        ->whereDate('start_date', '<=', $today)
        ->get();

    if ($projectsToStart->isNotEmpty()) {
        $admins = User::where('role', 'admin')->get();

        foreach ($projectsToStart as $project) {
            $project->update(['status' => 'In Progress']);
            Notification::send($admins, new ProjectStarted($project));
        }
    }
})->dailyAt('00:01');
