<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil password dari env ADMIN_PASSWORD; jangan hardcode di produksi
        $password = env('ADMIN_PASSWORD');

        if (!$password) {
            if (app()->environment('production')) {
                $this->command->error('ADMIN_PASSWORD belum di-set di .env — seeder dilewati.');
                return;
            }
            $password = 'sodongbasari2026'; // hanya untuk local dev
        }

        User::updateOrCreate(
            ['email' => 'admin@desa-sodongbasari.id'],
            [
                'name'     => 'Admin Panitia Pilkades',
                'email'    => 'admin@desa-sodongbasari.id',
                'password' => Hash::make($password),
            ]
        );
    }
}
