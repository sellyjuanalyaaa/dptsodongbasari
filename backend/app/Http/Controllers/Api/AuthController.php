<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Hash bcrypt palsu — dipakai saat user tidak ada
     * agar waktu respons sama (cegah timing side-channel / email enumeration).
     */
    private const DUMMY_HASH = '$2y$12$axJ4comwq3Z5Ljva46o//OUS8oQ2LJasGc51adJmASqdPxm.8AkvK';

    /**
     * POST /api/login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string|between:6,255',
        ]);

        $user = User::where('email', $request->email)->first();

        // Selalu jalankan Hash::check (timing-safe)
        $hash = $user?->password ?? self::DUMMY_HASH;
        $valid = Hash::check($request->password, $hash);

        if (!$user || !$valid) {
            Log::warning('Login gagal', [
                'email' => $request->email,
                'ip'    => $request->ip(),
            ]);

            throw ValidationException::withMessages([
                'email' => ['Email atau password tidak valid.'],
            ]);
        }

        // Single session: cabut semua token lama
        $user->tokens()->delete();

        // Token kedaluwarsa dalam 8 jam
        $token = $user->createToken('admin-token', ['*'], now()->addHours(8))->plainTextToken;

        Log::info('Login berhasil', [
            'user_id' => $user->id,
            'ip'      => $request->ip(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Login berhasil.',
            'token'   => $token,
            'expires_in' => 8 * 60 * 60,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * GET /api/me — validasi token & ambil user (dipakai frontend saat boot)
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tidak terautentikasi.',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'user'   => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Logout berhasil.',
        ]);
    }
}
