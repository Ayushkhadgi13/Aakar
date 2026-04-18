<?php

namespace App\Notifications;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BudgetOverrun extends Notification
{
    use Queueable;

    public function __construct(
        protected Project $project,
        protected float $budget,
        protected float $totalExpense
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Budget Overrun Alert',
            'message' => "Project \"{$this->project->name}\" has exceeded its budget. Budget: Rs. " . number_format($this->budget, 2) . ", Expenses: Rs. " . number_format($this->totalExpense, 2) . '.',
            'project_id' => $this->project->id,
        ];
    }
}
