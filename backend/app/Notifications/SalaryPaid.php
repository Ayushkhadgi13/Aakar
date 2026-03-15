<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SalaryPaid extends Notification
{
    use Queueable;

    protected $amount;
    protected $month;

    public function __construct(float $amount, string $month)
    {
        $this->amount = $amount;
        $this->month = $month;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Salary Paid',
            'message' => "Your salary of Rs. " . number_format($this->amount, 2) . " for {$this->month} has been processed.",
        ];
    }
}