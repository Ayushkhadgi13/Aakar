<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorMaterial extends Model {
    protected $fillable = ['vendor_id', 'material_name', 'unit_price', 'quantity', 'total_price'];

    public function vendor() {
        return $this->belongsTo(Vendor::class);
    }
}