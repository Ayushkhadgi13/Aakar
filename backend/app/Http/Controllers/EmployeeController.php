<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'users' => User::orderBy('created_at', 'desc')->get(),
            'payroll_employees' => Employee::all()
        ]);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'dob' => 'required|date',
            'role' => 'required|string',
            'salary' => 'nullable|numeric|min:0',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['dob']),
            'role' => $validated['role'],
        ]);

        $employee = null;
        if (isset($validated['salary'])) {
            $employee = Employee::create([
                'name' => $validated['name'],
                'role' => $validated['role'],
                'salary_amount' => $validated['salary'],
                'join_date' => now()->toDateString(),
            ]);
        }

        return response()->json([
            'message' => 'Employee created successfully',
            'user' => $user,
            'payroll_entry' => $employee
        ]);
    }
}
