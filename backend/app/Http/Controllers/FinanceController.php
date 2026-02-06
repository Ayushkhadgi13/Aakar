<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Vendor;
use App\Models\Employee;
use App\Models\VendorMaterial;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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

        return response()->json([
            'total_balance' => (float)($income - $expense - $prepayment),
            'total_income' => $income,
            'total_expense' => $expense,
            'total_prepayment' => $prepayment,
            'monthly_stats' => $monthlyStats,
            'recent_transactions' => Transaction::orderBy('date', 'desc')->take(5)->get()
        ]);
    }

    public function getVendors() {
        return response()->json(Vendor::with(['materials', 'project'])->orderBy('created_at', 'desc')->get());
    }

    public function storeVendor(Request $request) {
        $data = $request->validate([
            'name' => 'required|string',
            'project_id' => 'required|exists:projects,id',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'materials' => 'required|array|min:1',
            'materials.*.material_name' => 'required|string',
            'materials.*.unit_price' => 'required|numeric|min:0',
            'materials.*.quantity' => 'required|numeric|min:1',
        ]);

        $vendor = Vendor::create([
            'name' => $data['name'],
            'project_id' => $data['project_id'],
            'contact_person' => $data['contact_person'],
            'phone' => $data['phone']
        ]);

        foreach ($data['materials'] as $mat) {
            VendorMaterial::create([
                'vendor_id' => $vendor->id,
                'material_name' => $mat['material_name'],
                'unit_price' => $mat['unit_price'],
                'quantity' => $mat['quantity'],
                'total_price' => $mat['unit_price'] * $mat['quantity']
            ]);
        }

        return response()->json($vendor->load(['materials', 'project']));
    }

    // EMPLOYEE LOGIC
    public function getEmployees() {
        return response()->json(Employee::orderBy('name', 'asc')->get());
    }

    public function storeEmployee(Request $request) {
        // --- ADMIN CHECK ADDED HERE ---
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Only admins can add employees.'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string',
            'role' => 'required|string',
            'salary_amount' => 'required|numeric|min:0',
            'join_date' => 'required|date',
        ]);
        return response()->json(Employee::create($data));
    }

    public function paySalary(Request $request, $id) {
        $employee = Employee::findOrFail($id);
        
        $transaction = Transaction::create([
            'type' => 'expense',
            'amount' => $employee->salary_amount,
            'category' => 'Salary',
            'date' => Carbon::now()->toDateString(),
            'description' => "Salary payment for " . $employee->name . " - " . Carbon::now()->format('F Y'),
        ]);

        return response()->json(['message' => 'Salary processed', 'transaction' => $transaction]);
    }

    public function storeTransaction(Request $request) {
        $data = $request->validate([
            'type' => 'required|in:income,expense,pre-payment',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'date' => 'required|date',
            'description' => 'nullable|string',
        ]);
        return response()->json(Transaction::create($data));
    }
}