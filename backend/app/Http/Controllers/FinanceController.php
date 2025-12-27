<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinanceController extends Controller {
    
    public function getSummary() {
        $income = Transaction::where('type', 'income')->sum('amount');
        $expense = Transaction::where('type', 'expense')->sum('amount');
        
        // Stats for the last 6 months (for the Bar Chart)
        $monthlyStats = Transaction::select(
            DB::raw('MONTHNAME(date) as month'),
            DB::raw('SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as income'),
            DB::raw('SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END) as expense')
        )
        ->where('date', '>=', Carbon::now()->subMonths(6))
        ->groupBy('month')
        ->orderBy('date', 'asc')
        ->get();

        // Category breakdown for the Donut Chart
        $categoryBreakdown = Transaction::where('type', 'expense')
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->get();

        $vendorExpense = Transaction::where('type', 'expense')->whereNotNull('vendor_id')->sum('amount');

        return response()->json([
            'total_balance' => (float)($income - $expense),
            'total_income' => (float)$income,
            'total_expense' => (float)$expense,
            'vendor_total' => (float)$vendorExpense,
            'internal_total' => (float)($expense - $vendorExpense),
            'monthly_stats' => $monthlyStats,
            'category_breakdown' => $categoryBreakdown,
            'recent_transactions' => Transaction::with('vendor')->orderBy('date', 'desc')->take(5)->get()
        ]);
    }

    public function getTransactions() {
        return response()->json(Transaction::with('vendor')->orderBy('date', 'desc')->get());
    }

    public function storeTransaction(Request $request) {
        $data = $request->validate([
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric',
            'category' => 'required|string',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'vendor_id' => 'nullable|exists:vendors,id'
        ]);

        return response()->json(Transaction::create($data));
    }

    public function getVendors() {
        return response()->json(Vendor::all());
    }

    public function storeVendor(Request $request) {
        $data = $request->validate([
            'name' => 'required|string',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email'
        ]);
        return response()->json(Vendor::create($data));
    }
}