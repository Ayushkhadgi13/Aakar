<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\MonthlyReport;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorMaterial;
use App\Notifications\SalaryPaid;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    private function getMonthNameExpression(string $column): string
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return "CASE CAST(strftime('%m', {$column}) AS INTEGER)
                WHEN 1 THEN 'January'
                WHEN 2 THEN 'February'
                WHEN 3 THEN 'March'
                WHEN 4 THEN 'April'
                WHEN 5 THEN 'May'
                WHEN 6 THEN 'June'
                WHEN 7 THEN 'July'
                WHEN 8 THEN 'August'
                WHEN 9 THEN 'September'
                WHEN 10 THEN 'October'
                WHEN 11 THEN 'November'
                WHEN 12 THEN 'December'
            END";
        }

        return "MONTHNAME({$column})";
    }

    private function getMonthNumberExpression(string $column): string
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return "CAST(strftime('%m', {$column}) AS INTEGER)";
        }

        return "MONTH({$column})";
    }

    private function getShortMonthExpression(string $column): string
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return "CASE CAST(strftime('%m', {$column}) AS INTEGER)
                WHEN 1 THEN 'Jan'
                WHEN 2 THEN 'Feb'
                WHEN 3 THEN 'Mar'
                WHEN 4 THEN 'Apr'
                WHEN 5 THEN 'May'
                WHEN 6 THEN 'Jun'
                WHEN 7 THEN 'Jul'
                WHEN 8 THEN 'Aug'
                WHEN 9 THEN 'Sep'
                WHEN 10 THEN 'Oct'
                WHEN 11 THEN 'Nov'
                WHEN 12 THEN 'Dec'
            END";
        }

        return "DATE_FORMAT({$column}, '%b')";
    }

    public function getSummary(Request $request)
    {
        $query = Transaction::query();
        $matQuery = VendorMaterial::query();
        $projectMonthNameExpression = $this->getMonthNameExpression('transactions.date');
        $projectMonthNumberExpression = $this->getMonthNumberExpression('transactions.date');
        $monthLabelExpression = $this->getShortMonthExpression('date');
        $monthNumberExpression = $this->getMonthNumberExpression('date');
        $activityQuery = Transaction::query();
        $activityPeriodLabel = Carbon::now()->format('F Y');

        $allTimeIncome = (float) Transaction::where('type', 'income')->sum('amount');
        $allTimeExpense = (float) Transaction::where('type', 'expense')->sum('amount');
        $allTimePrepayment = (float) Transaction::where('type', 'pre-payment')->sum('amount');
        $netBalance = max(0, $allTimeIncome - $allTimeExpense - $allTimePrepayment);

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
            $matQuery->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59',
            ]);
            $activityQuery->whereBetween('date', [$request->start_date, $request->end_date]);
            $activityPeriodLabel = Carbon::parse($request->start_date)->format('d M Y')
                . ' - '
                . Carbon::parse($request->end_date)->format('d M Y');
        } else {
            $activityQuery->whereBetween('date', [
                Carbon::now()->startOfMonth()->toDateString(),
                Carbon::now()->endOfMonth()->toDateString(),
            ]);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
            $matQuery->whereHas('vendor', function ($builder) use ($request) {
                $builder->where('project_id', $request->project_id);
            });
            $activityQuery->where('project_id', $request->project_id);
        }

        $income = (float) (clone $query)->where('type', 'income')->sum('amount');
        $expense = (float) (clone $query)->where('type', 'expense')->sum('amount');
        $prepayment = (float) (clone $query)->where('type', 'pre-payment')->sum('amount');

        $projectMonthlyStats = Transaction::leftJoin('projects', 'transactions.project_id', '=', 'projects.id')
            ->select(
                DB::raw("{$projectMonthNameExpression} as month"),
                DB::raw("{$projectMonthNumberExpression} as month_num"),
                DB::raw('COALESCE(projects.name, "General / Unassigned") as project_name'),
                DB::raw('SUM(transactions.amount) as cost')
            )
            ->whereIn('transactions.type', ['expense', 'pre-payment'])
            ->where('transactions.date', '>=', Carbon::now()->subMonths(6))
            ->when($request->filled('project_id'), function ($builder) use ($request) {
                $builder->where('transactions.project_id', $request->project_id);
            })
            ->groupBy('month', 'month_num', 'projects.name')
            ->orderBy('month_num')
            ->get();

        $monthlyStats = Transaction::select(
            DB::raw("{$monthLabelExpression} as month"),
            DB::raw("{$monthNumberExpression} as month_num"),
            DB::raw('SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as income'),
            DB::raw('SUM(CASE WHEN type IN ("expense", "pre-payment") THEN amount ELSE 0 END) as expense')
        )
            ->where('date', '>=', Carbon::now()->subMonths(6))
            ->groupBy('month', 'month_num')
            ->orderBy('month_num')
            ->get();

        $categoryBreakdown = (clone $query)
            ->select('category', DB::raw('SUM(amount) as total'))
            ->whereIn('type', ['expense', 'pre-payment'])
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $materialBreakdown = (clone $matQuery)
            ->select('material_name', DB::raw('SUM(total_price) as total_cost'))
            ->groupBy('material_name')
            ->orderByDesc('total_cost')
            ->get();

        return response()->json([
            'total_balance' => $netBalance,
            'total_income' => $income,
            'total_expense' => $expense,
            'total_prepayment' => $prepayment,
            'monthly_stats' => $monthlyStats,
            'project_monthly_stats' => $projectMonthlyStats,
            'category_breakdown' => $categoryBreakdown,
            'material_breakdown' => $materialBreakdown,
            'activity_period_label' => $activityPeriodLabel,
            'monthly_activity' => $activityQuery
                ->with(['project:id,name', 'vendor:id,name'])
                ->orderByDesc('date')
                ->orderByDesc('id')
                ->get(),
            'recent_transactions' => (clone $query)->orderByDesc('date')->take(5)->get(),
        ]);
    }

    public function getVendors()
    {
        return response()->json(
            Vendor::with(['materials', 'project'])->orderByDesc('created_at')->get()
        );
    }

    public function storeVendor(Request $request)
    {
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
            'phone' => $request->input('phone'),
        ]);

        foreach ($data['materials'] as $material) {
            VendorMaterial::create([
                'vendor_id' => $vendor->id,
                'material_name' => $material['material_name'],
                'unit_price' => $material['unit_price'],
                'quantity' => $material['quantity'],
                'total_price' => $material['unit_price'] * $material['quantity'],
            ]);
        }

        return response()->json($vendor->load(['materials', 'project']));
    }

    public function addVendorMaterial(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        $data = $request->validate([
            'material_name' => 'required|string',
            'unit_price' => 'required|numeric|min:0',
            'quantity' => 'required|numeric|min:0.01',
        ]);

        $material = VendorMaterial::create([
            'vendor_id' => $vendor->id,
            'material_name' => $data['material_name'],
            'unit_price' => $data['unit_price'],
            'quantity' => $data['quantity'],
            'total_price' => $data['unit_price'] * $data['quantity'],
        ]);

        return response()->json([
            'message' => 'Material added successfully.',
            'material' => $material,
            'vendor' => $vendor->load(['materials', 'project']),
        ], 201);
    }

    public function getEmployees()
    {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        $employees = Employee::orderBy('name')->get()->map(function ($employee) use ($currentMonth, $currentYear) {
            $descriptionPrefix = 'Salary payment for ' . $employee->name;
            $employee->paid_this_month = Transaction::where('category', 'Salary')
                ->where('description', 'LIKE', $descriptionPrefix . '%')
                ->whereMonth('date', $currentMonth)
                ->whereYear('date', $currentYear)
                ->exists();

            return $employee;
        });

        return response()->json($employees);
    }

    public function storeEmployee(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string',
            'role' => 'required|string',
            'salary_amount' => 'required|numeric|min:0',
            'join_date' => 'required|date',
        ]);

        return response()->json(Employee::create($data));
    }

    public function paySalary(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        $monthLabel = Carbon::now()->format('F Y');
        $descriptionPrefix = 'Salary payment for ' . $employee->name;

        $alreadyPaid = Transaction::where('category', 'Salary')
            ->where('description', 'LIKE', $descriptionPrefix . '%')
            ->whereMonth('date', $currentMonth)
            ->whereYear('date', $currentYear)
            ->exists();

        if ($alreadyPaid) {
            return response()->json([
                'message' => 'Salary already paid for ' . $employee->name . ' this month.',
            ], 422);
        }

        $transaction = Transaction::create([
            'type' => 'expense',
            'amount' => $employee->salary_amount,
            'category' => 'Salary',
            'date' => Carbon::now()->toDateString(),
            'description' => $descriptionPrefix . ' - ' . $monthLabel,
        ]);

        $user = User::where('name', $employee->name)->first();
        if ($user) {
            $user->notify(new SalaryPaid((float) $employee->salary_amount, $monthLabel));
        }

        return response()->json([
            'message' => 'Salary processed',
            'transaction' => $transaction,
        ]);
    }

    public function storeTransaction(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:income,expense,pre-payment',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
        ]);

        return response()->json(Transaction::create($validated));
    }

    public function getMonthlyReports(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            MonthlyReport::query()
                ->orderByDesc('year')
                ->orderByDesc('month_number')
                ->get()
        );
    }
}
