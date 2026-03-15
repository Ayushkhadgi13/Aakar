<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\ProjectDocument;

class BOQUploaded extends Notification
{
    use Queueable;

    protected $document;
    protected $uploaderName;

    public function __construct(ProjectDocument $document, string $uploaderName)
    {
        $this->document = $document;
        $this->uploaderName = $uploaderName;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New BOQ Uploaded',
            'message' => "{$this->uploaderName} uploaded a new BOQ file \"{$this->document->original_name}\" and it requires your review.",
            'project_id' => $this->document->project_id,
            'document_id' => $this->document->id,
        ];
    }
}