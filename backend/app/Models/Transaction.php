<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model {
    protected $fillable = ['type', 'amount', 'category', 'date', 'description', 'vendor_id'];

    public function vendor() {
        return $this->belongsTo(Vendor::class);
    }
}