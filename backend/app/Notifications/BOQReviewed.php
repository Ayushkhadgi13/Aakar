<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\ProjectDocument;

class BOQReviewed extends Notification
{
    use Queueable;

    protected $document;
    protected $status;

    public function __construct(ProjectDocument $document, string $status)
    {
        $this->document = $document;
        $this->status = $status;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $label = $this->status === 'approved' ? '✅ Approved' : '❌ Rejected';
        return [
            'title' => "BOQ {$label}",
            'message' => "The BOQ file \"{$this->document->original_name}\" has been {$this->status} by an admin.",
            'project_id' => $this->document->project_id,
            'document_id' => $this->document->id,
        ];
    }
}
