<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pemilih extends Model
{
    use HasFactory;

    protected $table = 'pemilih';

    protected $fillable = [
        'no',
        'nama',
        'nik',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat_dusun',
        'alamat_rt',
        'alamat_rw',
        'no_tps',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
    ];
}
