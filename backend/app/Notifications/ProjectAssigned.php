<?php

namespace App\Notifications;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ProjectAssigned extends Notification
{
    use Queueable;

    public function __construct(
        protected Project $project,
        protected string $assignerName
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New Project Assignment',
            'message' => "{$this->assignerName} assigned you to the project: \"{$this->project->name}\".",
            'project_id' => $this->project->id,
        ];
    }
}
