<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FinanceController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Finance Module Routes
    Route::get('/finance/summary', [FinanceController::class, 'getSummary']);
    Route::get('/finance/reports', [FinanceController::class, 'getMonthlyReports']); // New Route
    Route::get('/finance/transactions', [FinanceController::class, 'getTransactions']);
    Route::post('/finance/transactions', [FinanceController::class, 'storeTransaction']);
    Route::get('/finance/vendors', [FinanceController::class, 'getVendors']);
    Route::post('/finance/vendors', [FinanceController::class, 'storeVendor']);
});