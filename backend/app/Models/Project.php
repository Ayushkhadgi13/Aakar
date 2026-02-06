<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model {
    protected $fillable = [
        'name', 'client_name', 'location', 'budget', 
        'status', 'start_date', 'end_date', 'progress'
    ];

    public function updates() {
        return $this->hasMany(ProjectUpdate::class)->orderBy('created_at', 'asc');
    }

    // New Relationship
    public function documents() {
        return $this->hasMany(ProjectDocument::class)->orderBy('created_at', 'desc');
    }
}