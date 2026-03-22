<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\NotificationController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Enable broadcasting auth routes via Sanctum so Echo can connect securely
Broadcast::routes(['middleware' => ['auth:sanctum']]);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout',[AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) { return $request->user(); });

    // Notification Routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Finance Routes
    Route::get('/finance/summary', [FinanceController::class, 'getSummary']);
    Route::get('/finance/vendors', [FinanceController::class, 'getVendors']);
    Route::post('/finance/vendors', [FinanceController::class, 'storeVendor']);
    Route::post('/finance/transactions', [FinanceController::class, 'storeTransaction']);

    // Payroll Routes
    Route::get('/finance/employees', [FinanceController::class, 'getEmployees']);
    Route::post('/finance/employees',[FinanceController::class, 'storeEmployee']);
    Route::post('/finance/employees/{id}/pay',[FinanceController::class, 'paySalary']);

    // System Employee Management Routes
    Route::get('/system/employees', [EmployeeController::class, 'index']);
    Route::post('/system/employees',[EmployeeController::class, 'store']);

    // Project Module Routes
    Route::get('/projects',[ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}',[ProjectController::class, 'destroy']);
    Route::post('/projects/{id}/assign',[ProjectController::class, 'assignUsers']);

    // Project Specifics
    Route::post('/projects/{id}/updates',[ProjectController::class, 'addUpdate']);
    Route::post('/projects/{id}/documents',[ProjectController::class, 'uploadDocument']);

    // Document Review (Admin Only)
    Route::patch('/documents/{id}/approve', [ProjectController::class, 'approveDocument']);
    Route::patch('/documents/{id}/reject', [ProjectController::class, 'rejectDocument']);
    Route::delete('/documents/{id}',[ProjectController::class, 'deleteDocument']);

    // BOQ & Estimates
    Route::post('/projects/{id}/estimates', [ProjectController::class, 'storeEstimates']);
    Route::get('/projects/{id}/boq', [ProjectController::class, 'getBOQAnalysis']);
    Route::get('/projects/{id}/financial-variance', [ProjectController::class, 'getFinancialVariance']);

    // Material Routes
    Route::post('/materials/usage', [MaterialController::class, 'logUsage']);
    Route::get('/projects/{id}/inventory', [MaterialController::class, 'getInventoryStatus']);

    // Task Routes
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/stats',[TaskController::class, 'userStats']);
    Route::get('/users-list',[TaskController::class, 'getUsers']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
});