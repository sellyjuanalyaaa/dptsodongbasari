<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pemilih;

class PemilihSeeder extends Seeder
{
    public function run(): void
    {
        Pemilih::firstOrCreate(
            ['nik' => '3327011205950001'],
            [
                'no' => 1,
                'nama' => 'Budi Santoso',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Pemalang',
                'tanggal_lahir' => '1995-05-12',
                'alamat_dusun' => 'Sodong',
                'alamat_rt' => '001',
                'alamat_rw' => '002',
                'no_tps' => '01',
                'keterangan' => 'Memenuhi Syarat',
            ]
        );

        Pemilih::firstOrCreate(
            ['nik' => '3327014808980002'],
            [
                'no' => 2,
                'nama' => 'Siti Rahmawati',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Pemalang',
                'tanggal_lahir' => '1998-08-18',
                'alamat_dusun' => 'Basari',
                'alamat_rt' => '003',
                'alamat_rw' => '001',
                'no_tps' => '02',
                'keterangan' => 'Memenuhi Syarat',
            ]
        );
    }
}
