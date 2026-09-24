<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pemilih', function (Blueprint $table) {
            $table->id();
            $table->integer('no')->nullable();
            $table->string('nama');
            $table->string('nik', 16)->unique();
            $table->char('jenis_kelamin', 1); // 'L' atau 'P'
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('alamat_dusun')->nullable();
            $table->string('alamat_rt', 10)->nullable();
            $table->string('alamat_rw', 10)->nullable();
            $table->string('no_tps')->nullable();
            $table->string('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pemilih');
    }
};
