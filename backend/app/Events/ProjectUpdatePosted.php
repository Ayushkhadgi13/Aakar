<?php

namespace App\Events;

use App\Models\ProjectUpdate;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectUpdatePosted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $update;

    public function __construct(ProjectUpdate $update)
    {
        // Load the user relation immediately so the frontend knows who sent the message
        $this->update = $update->load('user');
    }

    public function broadcastOn(): array
    {
        // Broadcast specifically to the private channel of the active project
        return[
            new PrivateChannel('project.' . $this->update->project_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ProjectUpdatePosted';
    }
}