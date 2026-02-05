<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\ProjectController;

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
    
    // HR / Employee Routes
    Route::get('/finance/employees', [FinanceController::class, 'getEmployees']);
    Route::post('/finance/employees', [FinanceController::class, 'storeEmployee']);
    Route::post('/finance/employees/{id}/pay', [FinanceController::class, 'paySalary']);

    Route::post('/finance/transactions', [FinanceController::class, 'storeTransaction']);

    // Project Module Routes
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::post('/projects/{id}/updates', [ProjectController::class, 'addUpdate']);
});