<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model {
    protected $fillable = [
        'name', 'client_name', 'location', 'budget', 
        'status', 'start_date', 'end_date', 'progress'
    ];

    // Add relationship
    public function updates() {
        return $this->hasMany(ProjectUpdate::class)->orderBy('created_at', 'asc');
    }
}