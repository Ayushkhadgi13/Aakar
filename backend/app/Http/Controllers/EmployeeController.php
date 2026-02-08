<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    // List all Users (System Employees)
    public function index(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        // Return both users and payroll employees to managing them
        return response()->json([
            'users' => User::orderBy('created_at', 'desc')->get(),
            'payroll_employees' => Employee::all()
        ]);
    }

    // Create New System Employee (User + Payroll Entry)
    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'dob' => 'required|date', // Used as password
            'role' => 'required|string', // e.g. admin, manager, staff
            'salary' => 'nullable|numeric|min:0', // Optional for payroll
        ]);

        // 1. Create User Login
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['dob']), // Password is DOB
            'role' => $validated['role'],
        ]);

        // 2. Create Payroll Record (if salary provided)
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