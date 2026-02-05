<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vendor extends Model {
    protected $fillable = ['name', 'contact_person', 'email', 'phone', 'address', 'project_id'];

    public function project() {
        return $this->belongsTo(Project::class);
    }

    public function transactions() {
        return $this->hasMany(Transaction::class);
    }

    public function materials() {
        return $this->hasMany(VendorMaterial::class);
    }
}