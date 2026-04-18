<?php

namespace App\Observers;

use App\Models\Project;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\BudgetOverrun;
use Illuminate\Support\Facades\Notification;

class TransactionObserver
{
    public function created(Transaction $transaction): void
    {
        $this->checkBudgetOverrun($transaction);
    }

    public function updated(Transaction $transaction): void
    {
        $this->checkBudgetOverrun($transaction);
    }

    protected function checkBudgetOverrun(Transaction $transaction): void
    {
        if (!$transaction->project_id) {
            return;
        }

        $project = Project::with('users')->find($transaction->project_id);

        if (!$project || !$project->budget) {
            return;
        }

        $totalExpenses = (float) $project->transactions()
            ->whereIn('type', ['expense', 'pre-payment'])
            ->sum('amount');

        if ($totalExpenses <= (float) $project->budget) {
            return;
        }

        if ($project->last_budget_alert_at && $project->last_budget_alert_at->gt(now()->subDay())) {
            return;
        }

        $admins = User::where('role', 'admin')->get();
        $recipients = $project->users->merge($admins)->unique('id')->values();

        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send(
            $recipients,
            new BudgetOverrun($project, (float) $project->budget, $totalExpenses)
        );

        $project->forceFill([
            'last_budget_alert_at' => now(),
        ])->save();
    }
}
