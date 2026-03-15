<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Task;

class TaskAssigned extends Notification
{
    use Queueable;

    protected $task;
    protected $assignerName;

    public function __construct(Task $task, string $assignerName)
    {
        $this->task = $task;
        $this->assignerName = $assignerName;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New Task Assigned',
            'message' => "{$this->assignerName} assigned you a new task: \"{$this->task->title}\". Due: {$this->task->due_date}.",
            'task_id' => $this->task->id,
        ];
    }
}