<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'name',
        'client_name',
        'location',
        'budget',
        'status',
        'start_date',
        'end_date',
        'progress',
        'last_budget_alert_at',
    ];

    protected $casts = [
        'last_budget_alert_at' => 'datetime',
    ];

    public function updates()
    {
        return $this->hasMany(ProjectUpdate::class)->orderBy('created_at', 'asc');
    }

    public function documents()
    {
        return $this->hasMany(ProjectDocument::class)->orderBy('created_at', 'desc');
    }

    public function estimates()
    {
        return $this->hasMany(ProjectMaterialEstimate::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class)
            ->withPivot(['assigned_at', 'assigned_by'])
            ->withTimestamps();
    }

    public function actualMaterials()
    {
        return $this->hasManyThrough(
            VendorMaterial::class,
            Vendor::class,
            'project_id',
            'vendor_id',
            'id',
            'id'
        );
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
