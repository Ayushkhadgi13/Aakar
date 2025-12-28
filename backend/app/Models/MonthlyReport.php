<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonthlyReport extends Model {
    protected $fillable = [
        'report_month', 'year', 'month_number', 
        'income', 'expense', 'balance', 
        'top_category', 'transaction_count'
    ];
}