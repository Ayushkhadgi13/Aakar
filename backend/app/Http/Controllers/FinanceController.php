<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Vendor;
use App\Models\Employee;
use App\Models\VendorMaterial;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Http\Requests\StoreTransactionRequest;
use App\Notifications\SalaryPaid;

class FinanceController extends Controller {

    public function getSummary(Request $request) {
        $query = Transaction::query();
        $matQuery = VendorMaterial::query();

        // 1. FILTER LOGIC: Restrict to exact dates if user specifies them
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date',[$request->start_date, $request->end_date]);
            // Materials use timestamp creation date since it is logged at entry
            $matQuery->whereBetween('created_at',[$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        }

        // Base totals calculated respecting the filters
        $income = (float) (clone $query)->where('type', 'income')->sum('amount');
        $expense = (float) (clone $query)->where('type', 'expense')->sum('amount');
        $prepayment = (float) (clone $query)->where('type', 'pre-payment')->sum('amount');
        
        // General month-over-month trend line 
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

        // DEEP DIVE: What exactly are we spending on? Group by transaction category
        $categoryBreakdown = (clone $query)
            ->select('category', DB::raw('SUM(amount) as total'))
            ->whereIn('type', ['expense', 'pre-payment'])
            ->groupBy('category')
            ->orderBy('total', 'desc')
            ->get();

        // DEEP DIVE: What exact materials are costing us money? (Steel, cement, etc.)
        $materialBreakdown = (clone $matQuery)
            ->select('material_name', DB::raw('SUM(total_price) as total_cost'))
            ->groupBy('material_name')
            ->orderBy('total_cost', 'desc')
            ->get();

        return response()->json([
            'total_balance' => (float)($income - $expense - $prepayment),
            'total_income' => $income,
            'total_expense' => $expense,
            'total_prepayment' => $prepayment,
            'monthly_stats' => $monthlyStats,
            'category_breakdown' => $categoryBreakdown, // Feeding Donut chart
            'material_breakdown' => $materialBreakdown, // Feeding Material Bar chart
            'recent_transactions' => (clone $query)->orderBy('date', 'desc')->take(5)->get()
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
            'contact_person' => $request->input('contact_person'),
            'phone' => $request->input('phone')
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

    public function getEmployees() {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        $employees = Employee::orderBy('name', 'asc')->get()->map(function ($emp) use ($currentMonth, $currentYear) {
            $descriptionPrefix = "Salary payment for " . $emp->name;

            $paidThisMonth = Transaction::where('category', 'Salary')
                ->where('description', 'LIKE', $descriptionPrefix . '%')
                ->whereMonth('date', $currentMonth)
                ->whereYear('date', $currentYear)
                ->exists();

            $emp->paid_this_month = $paidThisMonth;
            return $emp;
        });

        return response()->json($employees);
    }

    public function storeEmployee(Request $request) {
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
        
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        $monthLabel = Carbon::now()->format('F Y');
        
        $descriptionPrefix = "Salary payment for " . $employee->name;

        $alreadyPaid = Transaction::where('category', 'Salary')
            ->where('description', 'LIKE', $descriptionPrefix . '%')
            ->whereMonth('date', $currentMonth)
            ->whereYear('date', $currentYear)
            ->exists();

        if ($alreadyPaid) {
            return response()->json([
                'message' => 'Salary already paid for ' . $employee->name . ' this month.'
            ], 422);
        }
        
        $transaction = Transaction::create([
            'type' => 'expense',
            'amount' => $employee->salary_amount,
            'category' => 'Salary',
            'date' => Carbon::now()->toDateString(),
            'description' => $descriptionPrefix . " - " . $monthLabel,
        ]);

        $user = User::where('name', $employee->name)->first();
        if ($user) {
            $user->notify(new SalaryPaid((float) $employee->salary_amount, $monthLabel));
        }

        return response()->json(['message' => 'Salary processed successfully', 'transaction' => $transaction]);
    }

    public function storeTransaction(StoreTransactionRequest $request) {
        return response()->json(Transaction::create($request->validated()));
    }
}