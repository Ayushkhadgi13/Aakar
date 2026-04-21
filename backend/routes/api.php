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

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',[AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) { return $request->user(); });

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('/finance/summary', [FinanceController::class, 'getSummary']);
    Route::get('/finance/vendors', [FinanceController::class, 'getVendors']);
    Route::post('/finance/vendors', [FinanceController::class, 'storeVendor']);
    Route::post('/finance/vendors/{id}/materials', [FinanceController::class, 'addVendorMaterial']);
    Route::post('/finance/transactions', [FinanceController::class, 'storeTransaction']);
    Route::get('/reports/monthly', [FinanceController::class, 'getMonthlyReports']);

    Route::get('/finance/employees', [FinanceController::class, 'getEmployees']);
    Route::post('/finance/employees',[FinanceController::class, 'storeEmployee']);
    Route::post('/finance/employees/{id}/pay',[FinanceController::class, 'paySalary']);

    Route::get('/system/employees', [EmployeeController::class, 'index']);
    Route::post('/system/employees',[EmployeeController::class, 'store']);

    Route::get('/projects',[ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}',[ProjectController::class, 'destroy']);
    Route::post('/projects/{id}/assign',[ProjectController::class, 'assignUsers']);
    Route::get('/projects/{id}/members', [ProjectController::class, 'getMembers']);
    Route::post('/projects/{id}/members', [ProjectController::class, 'addMembers']);
    Route::delete('/projects/{id}/members/{userId}', [ProjectController::class, 'removeMember']);

    Route::post('/projects/{id}/updates',[ProjectController::class, 'addUpdate']);
    Route::post('/projects/{id}/documents',[ProjectController::class, 'uploadDocument']);

    Route::patch('/documents/{id}/approve', [ProjectController::class, 'approveDocument']);
    Route::patch('/documents/{id}/reject', [ProjectController::class, 'rejectDocument']);
    Route::delete('/documents/{id}',[ProjectController::class, 'deleteDocument']);

    Route::post('/projects/{id}/estimates', [ProjectController::class, 'storeEstimates']);
    Route::get('/projects/{id}/boq', [ProjectController::class, 'getBOQAnalysis']);
    Route::get('/projects/{id}/materials/comparison', [ProjectController::class, 'getMaterialComparison']);
    Route::get('/projects/{id}/financial-variance', [ProjectController::class, 'getFinancialVariance']);

    Route::post('/materials/usage', [MaterialController::class, 'logUsage']);
    Route::get('/projects/{id}/inventory', [MaterialController::class, 'getInventoryStatus']);

    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/stats',[TaskController::class, 'userStats']);
    Route::get('/users-list',[TaskController::class, 'getUsers']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
});
