<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Vendor;
use App\Models\VendorMaterial;
use App\Models\MonthlyReport; 
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Validation\Rule;

class FinanceController extends Controller {
    
    public function getSummary() {
        $income = (float) Transaction::where('type', 'income')->sum('amount');
        $expense = (float) Transaction::where('type', 'expense')->sum('amount');
        $prepayment = (float) Transaction::where('type', 'pre-payment')->sum('amount');
        
        $monthlyStats = Transaction::select(
            DB::raw('MONTHNAME(date) as month'),
            DB::raw('MONTH(date) as month_num'),
            DB::raw('SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as income'),
            DB::raw('SUM(CASE WHEN type = "expense" OR type = "pre-payment" THEN amount ELSE 0 END) as expense')
        )
        ->where('date', '>=', Carbon::now()->subMonths(6))
        ->groupBy(DB::raw('MONTHNAME(date)'), DB::raw('MONTH(date)'))
        ->orderBy('month_num', 'asc')
        ->get();

        $categoryBreakdown = Transaction::whereIn('type', ['expense', 'pre-payment'])
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->get();

        $vendorExpense = (float) Transaction::whereIn('type', ['expense', 'pre-payment'])->whereNotNull('vendor_id')->sum('amount');

        return response()->json([
            'total_balance' => (float)($income - $expense - $prepayment),
            'total_income' => $income,
            'total_expense' => $expense,
            'total_prepayment' => $prepayment, // New field
            'vendor_total' => $vendorExpense,
            'internal_total' => (float)($expense + $prepayment - $vendorExpense),
            'monthly_stats' => $monthlyStats,
            'category_breakdown' => $categoryBreakdown,
            'recent_transactions' => Transaction::with('vendor')->orderBy('date', 'desc')->take(5)->get()
        ]);
    }

    public function getMonthlyReports() {
        return response()->json(MonthlyReport::orderBy('year', 'desc')->orderBy('month_number', 'desc')->get());
    }

    public function getTransactions() {
        return response()->json(Transaction::with('vendor')->orderBy('date', 'desc')->get());
    }

    public function storeTransaction(Request $request) {
        $data = $request->validate([
            'type' => 'required|in:income,expense,pre-payment',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'vendor_id' => 'nullable|exists:vendors,id'
        ]);

        // Logic: Standard Income/Expense cannot be in the future. Pre-payment can.
        $transactionDate = Carbon::parse($data['date']);
        $today = Carbon::today();

        if (in_array($data['type'], ['income', 'expense']) && $transactionDate->isFuture()) {
            return response()->json([
                'message' => 'Standard Income/Expense dates cannot be in the future. Use "Pre-payment" for future bookings.'
            ], 422);
        }

        return response()->json(Transaction::create($data));
    }

    public function getVendors() {
        return response()->json(Vendor::with('materials')->orderBy('created_at', 'desc')->get());
    }

    public function storeVendor(Request $request) {
        $data = $request->validate([
            'name' => 'required|string',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'materials' => 'required|array|min:1',
            'materials.*.material_name' => 'required|string',
            'materials.*.unit_price' => 'required|numeric|min:0',
            'materials.*.quantity' => 'required|numeric|min:1',
        ]);

        $vendor = Vendor::create($request->only('name', 'contact_person', 'phone', 'email'));

        foreach ($data['materials'] as $mat) {
            VendorMaterial::create([
                'vendor_id' => $vendor->id,
                'material_name' => $mat['material_name'],
                'unit_price' => $mat['unit_price'],
                'quantity' => $mat['quantity'],
                'total_price' => $mat['unit_price'] * $mat['quantity']
            ]);
        }

        return response()->json($vendor->load('materials'));
    }
}