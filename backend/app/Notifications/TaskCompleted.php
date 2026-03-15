<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Task;

class TaskCompleted extends Notification
{
    use Queueable;

    protected $task;
    protected $completedByName;

    public function __construct(Task $task, string $completedByName)
    {
        $this->task = $task;
        $this->completedByName = $completedByName;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Task Completed',
            'message' => "{$this->completedByName} has completed the task: \"{$this->task->title}\".",
            'task_id' => $this->task->id,
        ];
    }
}