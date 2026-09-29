import { useState, useEffect } from 'react';
import CountdownTimer from '../components/CountdownTimer';
import api from '../api/axios';

// Tanggal target pemungutan suara: 9 November 2026
const TARGET_DATE = new Date('2026-11-09T07:00:00+07:00');

// Nama hari Jawa / pasaran (opsional - bisa dimatikan)
function getNamaHari(date) {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

export default function PublicPage() {
  const [step, setStep] = useState(() => {
    return parseInt(sessionStorage.getItem('dpt_step') || '1');
  });
  const [nik, setNik] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasilData, setHasilData] = useState(() => {
    const saved = sessionStorage.getItem('dpt_hasil');
    return saved ? JSON.parse(saved) : null;
  });

  const handleCekNIK = async (e) => {
    e.preventDefault();
    setError('');
    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      setError('NIK harus 16 digit angka sesuai e-KTP.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/check-nik', { nik });
      const data = res.data.data;
      setHasilData(data);
      setStep(2);
      sessionStorage.setItem('dpt_step', '2');
      sessionStorage.setItem('dpt_hasil', JSON.stringify(data));
    } catch (err) {
      if (err.response?.status === 404) {
        setError('NIK tidak ditemukan dalam Daftar Pemilih Tetap (DPT). Pastikan NIK sesuai e-KTP Anda.');
      } else {
        setError('Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setNik('');
    setHasilData(null);
    setError('');
    sessionStorage.removeItem('dpt_step');
    sessionStorage.removeItem('dpt_hasil');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b-2" style={{ borderColor: '#f96c00' }}>
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* Logo Kabupaten */}
            <img src="/logo-kabupaten-pemalang.png" alt="Logo Kabupaten Pemalang" className="w-12 h-12 object-contain drop-shadow" />
            <div className="text-left">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Kecamatan Belik · Kab. Pemalang</p>
              <h1 className="text-sm font-bold text-gray-800 leading-tight">DESA SODONG BASARI</h1>
            </div>
          </div>
          <h2 className="text-base font-bold text-gray-700 leading-snug">
            PANITIA PEMILIHAN KEPALA DESA<br />
            <span className="text-lg" style={{ color: '#f96c00' }}>SODONG BASARI 2026</span>
          </h2>
          <div className="mt-1 inline-block bg-orange-50 px-4 py-1 rounded-full">
            <p className="text-sm font-semibold" style={{ color: '#f96c00' }}>- CEK DPT ONLINE -</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Countdown Hero Card */}
        <div className="hero-gradient rounded-3xl p-6 text-white shadow-2xl animate-pulse-orange">
          <div className="text-center mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-100 mb-1">
              {'>>'} Jadwal Pelaksanaan
            </p>
            <h3 className="text-lg font-bold text-white leading-tight">
              PEMUNGUTAN SUARA PILKADES
            </h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-orange-200 animate-pulse"></div>
              <p className="text-sm text-orange-100 font-medium">
                {getNamaHari(TARGET_DATE)}
              </p>
              <div className="w-2 h-2 rounded-full bg-orange-200 animate-pulse"></div>
            </div>
          </div>

          <CountdownTimer targetDate={TARGET_DATE} />

          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex-1 h-px bg-white/30"></div>
            <p className="text-xs text-orange-100 px-2">Pastikan Anda Terdaftar!</p>
            <div className="flex-1 h-px bg-white/30"></div>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-3 py-2">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-1">
            <div className={`step-circle ${step >= 1 ? 'step-circle-active' : 'step-circle-inactive'}`}>
              {step > 1 ? 'OK' : '1'}
            </div>
            <span className="text-xs font-medium text-gray-500">Masukkan NIK</span>
          </div>
          {/* Line */}
          <div className="flex-1 max-w-20 relative h-1 rounded-full bg-gray-200 mb-4">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
              style={{ width: step >= 2 ? '100%' : '0%', background: '#f96c00' }}
            />
          </div>
          {/* Step 2 */}
          <div className="flex flex-col items-center gap-1">
            <div className={`step-circle ${step >= 2 ? 'step-circle-done' : 'step-circle-inactive'}`}>
              2
            </div>
            <span className="text-xs font-medium text-gray-500">Data Pemilih</span>
          </div>
        </div>

        {/* Form / Hasil */}
        {step === 1 ? (
          <div className="glass-card rounded-3xl p-6 animate-fade-in-up">
            <h3 className="text-base font-bold text-gray-800 mb-1">
              Masukkan Nomor Induk Kependudukan (NIK)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Masukkan 16 digit NIK sesuai e-KTP Anda untuk memeriksa apakah Anda terdaftar sebagai pemilih.
            </p>

            <form onSubmit={handleCekNIK} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor NIK (e-KTP)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  value={nik}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setNik(val);
                    setError('');
                  }}
                  placeholder="16 Digit NIK sesuai e-KTP"
                  className="w-full border-2 rounded-xl px-4 py-3 text-gray-800 text-base outline-none transition-all duration-200 focus:border-orange-400 focus:shadow-md"
                  style={{ borderColor: error ? '#ef4444' : '#e5e7eb' }}
                />
                <div className="flex justify-between mt-1">
                  {error ? (
                    <p className="text-xs text-red-500">{error}</p>
                  ) : (
                    <p className="text-xs text-gray-400">Contoh: 3327xxxxxxxxxx</p>
                  )}
                  <p className="text-xs text-gray-400">{nik.length}/16</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || nik.length !== 16}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    Memeriksa...
                  </>
                ) : (
                  <>
                    Cek Data Pemilih {'>'}
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Hasil Card */
          <div className="animate-fade-in-up space-y-4">
            {/* Success Banner */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl font-bold text-green-600">OK</div>
              <div>
                <p className="text-sm font-bold text-green-700">Anda Terdaftar sebagai Pemilih!</p>
                <p className="text-xs text-green-600">Harap datang ke TPS pada hari pemungutan suara.</p>
              </div>
            </div>

            {/* Data Card */}
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800">Data Pemilih</h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ background: '#f96c00' }}>
                  DPT 2026
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'NIK', value: hasilData?.nik, icon: '#' },
                  { label: 'Nama Lengkap', value: hasilData?.nama, icon: '*' },
                  { label: 'Jenis Kelamin', value: hasilData?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan', icon: '' },
                  { label: 'No. TPS', value: hasilData?.no_tps ? `TPS ${hasilData.no_tps}` : '-', icon: '#' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="hasil-card">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">{icon ? `${icon} ` : ''}{label}</p>
                    <p className="text-sm font-bold text-gray-800">{value || '-'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Info TPS */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 text-xs text-orange-700">
              <p className="font-semibold mb-1">Informasi Penting:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Bawa e-KTP asli saat ke TPS</li>
                <li>Hadir sesuai jadwal yang ditentukan</li>
                <li>Jaga ketertiban dan keamanan selama pemungutan suara</li>
              </ul>
            </div>

            <button onClick={handleReset} className="w-full py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 hover:bg-orange-50"
              style={{ borderColor: '#f96c00', color: '#f96c00' }}>
              ← Cek NIK Lain
            </button>
          </div>
        )}

        {/* Footer Sekretariat */}
        <div className="text-center pt-2 pb-6 space-y-1">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
            <span className="font-medium">Sekretariat:</span>
          </div>
          <p className="text-xs text-gray-500">Kantor Desa Sodong Basari</p>
          <p className="text-xs text-gray-500">Kecamatan Belik, Kabupaten Pemalang</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-16 bg-gray-200"></div>
            <p className="text-xs text-gray-400">© 2026 Panitia Pilkades Sodong Basari</p>
            <div className="h-px w-16 bg-gray-200"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
