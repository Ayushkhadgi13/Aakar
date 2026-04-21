<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Project;

Broadcast::channel('project.{id}', function ($user, $id) {
    if ($user->role === 'admin') {
        return true;
    }

    $project = Project::find($id);
    return $project && $project->users->contains($user->id);
});
