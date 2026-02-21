<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialUsage extends Model
{
    protected $fillable = [
        'project_id',
        'material_name',
        'quantity_used',
        'date',
        'logged_by'
    ];

    /**
     * Get the project associated with the usage log.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who logged this usage.
     */
    public function logger()
    {
        return $this->belongsTo(User::class, 'logged_by');
    }
}