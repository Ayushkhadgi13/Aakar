<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\EmployeeController; 
use App\Http\Controllers\MaterialController;


// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth & User
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Finance Module Routes
    Route::get('/finance/summary', [FinanceController::class, 'getSummary']);
    Route::get('/finance/vendors', [FinanceController::class, 'getVendors']);
    Route::post('/finance/vendors', [FinanceController::class, 'storeVendor']);
    Route::post('/finance/transactions', [FinanceController::class, 'storeTransaction']);
    
    // Legacy HR Routes (Payroll)
    Route::get('/finance/employees', [FinanceController::class, 'getEmployees']);
    Route::post('/finance/employees', [FinanceController::class, 'storeEmployee']);
    Route::post('/finance/employees/{id}/pay', [FinanceController::class, 'paySalary']);

    // System Employee Management Routes (Admin Panel)
    Route::get('/system/employees', [EmployeeController::class, 'index']);
    Route::post('/system/employees', [EmployeeController::class, 'store']);

    // Project Module Routes
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    
    // Project Specifics (Updates & Docs)
    Route::post('/projects/{id}/updates', [ProjectController::class, 'addUpdate']);
    Route::post('/projects/{id}/documents', [ProjectController::class, 'uploadDocument']);
    
    // BOQ, Estimates & Financial Analysis
    Route::post('/projects/{id}/estimates', [ProjectController::class, 'storeEstimates']); 
    Route::get('/projects/{id}/boq', [ProjectController::class, 'getBOQAnalysis']); 
    Route::get('/projects/{id}/financial-variance', [ProjectController::class, 'getFinancialVariance']);

    // --- NEW: Material Inventory & Consumption Routes ---
    Route::post('/materials/usage', [MaterialController::class, 'logUsage']);
    Route::get('/projects/{id}/inventory', [MaterialController::class, 'getInventoryStatus']);


    // Task Module Routes
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/stats', [TaskController::class, 'userStats']); 
    Route::get('/users-list', [TaskController::class, 'getUsers']); 
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
});