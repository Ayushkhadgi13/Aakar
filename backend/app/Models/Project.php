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

    public function documents() {
        return $this->hasMany(ProjectDocument::class)->orderBy('created_at', 'desc');
    }

    // New Relationship for BOQ
    public function estimates() {
        return $this->hasMany(ProjectMaterialEstimate::class);
    }
    
    // Helper to get actual materials used via Vendors
    public function actualMaterials() {
        return $this->hasManyThrough(
            VendorMaterial::class, 
            Vendor::class, 
            'project_id', // Foreign key on vendors table...
            'vendor_id', // Foreign key on vendor_materials table...
            'id', // Local key on projects table...
            'id' // Local key on vendors table...
        );
    }
}