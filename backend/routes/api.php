<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\EmployeeController; 

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Finance Module Routes
    Route::get('/finance/summary', [FinanceController::class, 'getSummary']);
    Route::get('/finance/vendors', [FinanceController::class, 'getVendors']);
    Route::post('/finance/vendors', [FinanceController::class, 'storeVendor']);
    
    // Legacy HR Routes
    Route::get('/finance/employees', [FinanceController::class, 'getEmployees']);
    Route::post('/finance/employees', [FinanceController::class, 'storeEmployee']);
    Route::post('/finance/employees/{id}/pay', [FinanceController::class, 'paySalary']);

    Route::post('/finance/transactions', [FinanceController::class, 'storeTransaction']);

    // System Employee Management Routes
    Route::get('/system/employees', [EmployeeController::class, 'index']);
    Route::post('/system/employees', [EmployeeController::class, 'store']);

    // Project Module Routes
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::post('/projects/{id}/updates', [ProjectController::class, 'addUpdate']);
    Route::post('/projects/{id}/documents', [ProjectController::class, 'uploadDocument']);

    // Task Module Routes
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/stats', [TaskController::class, 'userStats']); // <--- NEW ROUTE
    Route::get('/users-list', [TaskController::class, 'getUsers']); 
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
});