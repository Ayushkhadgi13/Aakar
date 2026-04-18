<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectDocument extends Model
{
    protected $fillable = [
        'project_id',
        'file_type',
        'original_name',
        'file_path',
        'status',
        'parsed_status',
        'version',
        'parent_document_id',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function parentDocument()
    {
        return $this->belongsTo(self::class, 'parent_document_id');
    }

    public function versions()
    {
        return $this->hasMany(self::class, 'parent_document_id')->orderByDesc('version');
    }

    public function estimates()
    {
        return $this->hasMany(ProjectMaterialEstimate::class, 'project_document_id');
    }
}
