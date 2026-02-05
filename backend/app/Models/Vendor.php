<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vendor extends Model {
    protected $fillable = ['name', 'contact_person', 'email', 'phone', 'address'];

    public function transactions() {
        return $this->hasMany(Transaction::class);
    }

    // Add this relationship
    public function materials() {
        return $this->hasMany(VendorMaterial::class);
    }
}