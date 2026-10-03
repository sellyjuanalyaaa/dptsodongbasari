<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pemilih;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PemilihController extends Controller
{
    /**
     * GET /api/pemilih — list semua data pemilih
     */
    public function index(Request $request)
    {
        $query = Pemilih::query()->orderBy('no')->orderBy('nama');

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('nik', 'like', "%{$s}%")
                  ->orWhere('alamat_dusun', 'like', "%{$s}%")
                  ->orWhere('no_tps', 'like', "%{$s}%");
            });
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->get(),
        ]);
    }

    /**
     * POST /api/pemilih — tambah satu data (isi manual)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'no'            => 'nullable|integer',
            'nama'          => 'required|string|max:255',
            'nik'           => 'required|string|size:16|regex:/^[0-9]+$/|unique:pemilih,nik',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir'  => 'nullable|string|max:100',
            'tanggal_lahir' => 'nullable|date',
            'alamat_dusun'  => 'nullable|string|max:100',
            'alamat_rt'     => 'nullable|string|max:10',
            'alamat_rw'     => 'nullable|string|max:10',
            'no_tps'        => 'nullable|string|max:20',
            'keterangan'    => 'nullable|string|max:255',
        ]);

        // Nomor urut unik — kalau sudah terpakai, lanjutkan dari nomor terbesar
        if (!empty($validated['no']) && Pemilih::where('no', $validated['no'])->exists()) {
            $validated['no'] = ((int) Pemilih::max('no')) + 1;
        } elseif (empty($validated['no'])) {
            $validated['no'] = ((int) Pemilih::max('no')) + 1;
        }

        $pemilih = Pemilih::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Data pemilih berhasil ditambahkan.',
            'data'    => $pemilih,
        ], 201);
    }

    /**
     * PUT /api/pemilih/{id} — update satu data pemilih
     */
    public function update(Request $request, $id)
    {
        $pemilih = Pemilih::findOrFail($id);

        $validated = $request->validate([
            'no'            => 'nullable|integer',
            'nama'          => 'required|string|max:255',
            'nik'           => 'required|string|size:16|unique:pemilih,nik,' . $id,
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir'  => 'nullable|string|max:100',
            'tanggal_lahir' => 'nullable|date',
            'alamat_dusun'  => 'nullable|string|max:100',
            'alamat_rt'     => 'nullable|string|max:10',
            'alamat_rw'     => 'nullable|string|max:10',
            'no_tps'        => 'nullable|string|max:20',
            'keterangan'    => 'nullable|string|max:255',
        ]);

        // Nomor urut unik — tolak nomor yang sudah dipakai baris lain
        if (isset($validated['no'])) {
            $taken = Pemilih::where('no', $validated['no'])->where('id', '!=', $id)->exists();
            if ($taken || $validated['no'] === null) {
                $validated['no'] = $pemilih->no ?? (((int) Pemilih::max('no')) + 1);
            }
        }

        $pemilih->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Data pemilih berhasil diperbarui.',
            'data'    => $pemilih,
        ]);
    }

    /**
     * DELETE /api/pemilih/{id} — hapus satu data pemilih
     */
    public function destroy($id)
    {
        $pemilih = Pemilih::findOrFail($id);
        $pemilih->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Data pemilih berhasil dihapus.',
        ]);
    }

    /**
     * POST /api/pemilih/import — import batch dari Excel (sudah di-parse di frontend)
     * Skip baris dengan NIK yang sudah ada (duplikat) — tidak di-overwrite.
     */
    public function import(Request $request)
    {
        $request->validate([
            'data'             => 'required|array|min:1',
            'data.*.nik'       => 'required|string',
            'data.*.nama'      => 'required|string',
        ]);

        $rows     = $request->data;
        $inserted = 0;
        $skipped  = 0;

        // Ambil semua NIK yang sudah ada sekaligus (efisien)
        $existingNiks = DB::table('pemilih')
            ->whereIn('nik', array_column($rows, 'nik'))
            ->pluck('nik')
            ->flip()
            ->all();

        // Nomor urut yang sudah terpakai — cegah nomor kembar antar batch import
        $existingNos = DB::table('pemilih')
            ->whereNotNull('no')
            ->pluck('no')
            ->mapWithKeys(fn ($n) => [(int) $n => true])
            ->all();
        $nextNo = (empty($existingNos) ? 0 : max(array_keys($existingNos))) + 1;

        $toInsert = [];
        $now      = now();

        foreach ($rows as $row) {
            $nik = trim($row['nik'] ?? '');
            if (!$nik || isset($existingNiks[$nik])) {
                $skipped++;
                continue;
            }
            $existingNiks[$nik] = true; // cegah duplikat dalam batch yang sama

            // Pakai nomor dari file bila belum dipakai; kalau kembar/kosong, lanjutkan urutan
            $no = (int) ($row['no'] ?? 0);
            if ($no <= 0 || isset($existingNos[$no])) {
                $no = $nextNo;
            }
            $nextNo = max($nextNo, $no + 1);
            $existingNos[$no] = true;

            $toInsert[] = [
                'no'            => $no,
                'nama'          => trim($row['nama']),
                'nik'           => $nik,
                'jenis_kelamin' => strtoupper(substr($row['jenis_kelamin'] ?? 'L', 0, 1)) === 'L' ? 'L' : 'P',
                'tempat_lahir'  => $row['tempat_lahir'] ?? null,
                'tanggal_lahir' => !empty($row['tanggal_lahir']) ? $row['tanggal_lahir'] : null,
                'alamat_dusun'  => $row['alamat_dusun'] ?? null,
                'alamat_rt'     => $row['alamat_rt'] ?? null,
                'alamat_rw'     => $row['alamat_rw'] ?? null,
                'no_tps'        => $row['no_tps'] ?? null,
                'keterangan'    => $row['keterangan'] ?? null,
                'created_at'    => $now,
                'updated_at'    => $now,
            ];
            $inserted++;
        }

        if (!empty($toInsert)) {
            // Insert dalam chunk untuk performa
            foreach (array_chunk($toInsert, 500) as $chunk) {
                DB::table('pemilih')->insert($chunk);
            }
        }

        return response()->json([
            'status'   => 'success',
            'inserted' => $inserted,
            'skipped'  => $skipped,
        ]);
    }
}
