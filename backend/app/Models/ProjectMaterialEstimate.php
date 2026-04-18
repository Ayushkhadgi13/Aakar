<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectMaterialEstimate extends Model
{
    protected $fillable = [
        'project_id',
        'project_document_id',
        'material_name',
        'estimated_quantity',
        'estimated_unit_price',
        'unit'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function document()
    {
        return $this->belongsTo(ProjectDocument::class, 'project_document_id');
    }
}
