<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Project;

// Restrict access to the project live chat
Broadcast::channel('project.{id}', function ($user, $id) {
    if ($user->role === 'admin') {
        return true;
    }
    
    // Check if standard user belongs to this specific project team
    $project = Project::find($id);
    return $project && $project->users->contains($user->id);
});