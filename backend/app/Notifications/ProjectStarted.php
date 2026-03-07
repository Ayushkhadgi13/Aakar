<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Project;

class ProjectStarted extends Notification
{
    use Queueable;

    protected $project;

    public function __construct(Project $project)
    {
        $this->project = $project;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'project_id' => $this->project->id,
            'title' => 'Project Started',
            'message' => "The project '{$this->project->name}' is scheduled to start today and has been moved to In Progress.",
        ];
    }
}