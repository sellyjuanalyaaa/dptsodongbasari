<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NikController;
use App\Http\Controllers\Api\PemilihController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — DPT Online Desa Sodong Basari
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/check-nik', [NikController::class, 'check'])->middleware('throttle:check-nik');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login');

// Protected routes (Laravel Sanctum token auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',   [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::prefix('pemilih')->group(function () {
        Route::get('/',        [PemilihController::class, 'index']);
        Route::post('/',       [PemilihController::class, 'store']);
        Route::post('/import', [PemilihController::class, 'import']);
        Route::put('/{id}',    [PemilihController::class, 'update']);
        Route::delete('/{id}', [PemilihController::class, 'destroy']);
    });
});
