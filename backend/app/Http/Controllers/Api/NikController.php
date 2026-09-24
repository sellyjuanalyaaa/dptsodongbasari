<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pemilih;
use Illuminate\Http\Request;

class NikController extends Controller
{
    /**
     * POST /api/check-nik
     * Public endpoint — cek apakah NIK terdaftar dalam DPT
     */
    public function check(Request $request)
    {
        $request->validate([
            'nik' => 'required|string|size:16',
        ]);

        $pemilih = Pemilih::where('nik', $request->nik)->first();

        if (!$pemilih) {
            return response()->json([
                'status'  => 'not_found',
                'message' => 'NIK tidak ditemukan dalam Daftar Pemilih Tetap.',
            ], 404);
        }

        return response()->json([
            'status' => 'found',
            'data'   => [
                'nik'           => $pemilih->nik,
                'nama'          => $pemilih->nama,
                'jenis_kelamin' => $pemilih->jenis_kelamin,
                'no_tps'        => $pemilih->no_tps,
            ],
        ]);
    }
}
