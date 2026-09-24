import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import api from '../api/axios';

// Translate common Laravel validation messages to Indonesian
function apiErrorMessage(err, fallback = 'Terjadi kesalahan.') {
  const data = err?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    const msg = Array.isArray(first) ? first[0] : first;
    if (msg) {
      if (/nik has already been taken/i.test(msg)) return 'NIK sudah terdaftar. Gunakan NIK lain.';
      if (/nama field is required/i.test(msg)) return 'Nama wajib diisi.';
      if (/nik/i.test(msg) && /size:16|16/i.test(msg)) return 'NIK harus 16 digit angka.';
      if (/nik/i.test(msg) && /regex|numeric|digits/i.test(msg)) return 'NIK hanya boleh angka (16 digit).';
      return msg;
    }
  }
  if (data?.message) {
    if (/nik has already been taken/i.test(data.message)) return 'NIK sudah terdaftar. Gunakan NIK lain.';
    return data.message;
  }
  if (err?.message === 'Network Error') return 'Tidak bisa terhubung ke server. Pastikan backend berjalan.';
  return fallback;
}

// Shared form field — must be defined OUTSIDE modals so React keeps
// the same component identity (otherwise inputs remount and lose focus).
function Field({ label, name, form, onChange, type = 'text', options, required, disabled, placeholder }) {
  const value = form?.[name] ?? '';
  const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed placeholder:text-gray-400';
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {options ? (
        <select value={value} onChange={e => onChange(name, e.target.value)} disabled={disabled}
          className={cls}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(name, e.target.value)} disabled={disabled}
          placeholder={placeholder}
          className={cls} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal Isi Manual (tambah data baru)
// ─────────────────────────────────────────────
function ModalAdd({ nextNo, onClose, onSaved, onError }) {
  const empty = {
    no: nextNo || '', nama: '', nik: '', jenis_kelamin: 'L',
    tempat_lahir: '', tanggal_lahir: '', alamat_dusun: '',
    alamat_rt: '', alamat_rw: '', no_tps: '', keterangan: '',
  };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  const handleSave = async () => {
    setError('');
    if (!form.nama.trim()) { setError('Nama wajib diisi.'); return; }
    if (!/^\d{16}$/.test(String(form.nik).trim())) { setError('NIK harus 16 digit angka.'); return; }
    setLoading(true);
    try {
      await api.post('/pemilih', form);
      onSaved();
    } catch (err) {
      const msg = apiErrorMessage(err, 'Gagal menyimpan data.');
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const f = { form, onChange: handleChange };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#f96c00' }}>
          <div>
            <h3 className="font-bold text-gray-800">✎ Isi Manual Data Pemilih</h3>
            <p className="text-xs text-gray-500">Isi formulir di bawah, lalu Simpan.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field {...f} label="No. (otomatis)" name="no" type="number" disabled />
            <Field {...f} label="No. TPS" name="no_tps" placeholder="cth: 1" />
          </div>
          <Field {...f} label="Nama Pemilih" name="nama" required placeholder="cth: BUDI SANTOSO" />
          <Field {...f} label="NIK (16 digit)" name="nik" required placeholder="cth: 3327030404760011" />
          <Field {...f} label="Jenis Kelamin" name="jenis_kelamin" options={[
            { value: 'L', label: 'Laki-laki' },
            { value: 'P', label: 'Perempuan' },
          ]} />
          <div className="grid grid-cols-2 gap-3">
            <Field {...f} label="Tempat Lahir" name="tempat_lahir" placeholder="cth: PEMALANG" />
            <Field {...f} label="Tanggal Lahir" name="tanggal_lahir" type="date" />
          </div>
          <Field {...f} label="Alamat Dusun" name="alamat_dusun" placeholder="cth: Dusun Krajan" />
          <div className="grid grid-cols-2 gap-3">
            <Field {...f} label="RT" name="alamat_rt" placeholder="cth: 01" />
            <Field {...f} label="RW" name="alamat_rw" placeholder="cth: 02" />
          </div>
          <Field {...f} label="Keterangan" name="keterangan" placeholder="cth: DPS" />
        </div>

        {error && (
          <div className="mx-6 mb-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 font-medium">
            {error}
          </div>
        )}

        <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-3xl">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            style={{ borderColor: '#e5e7eb' }}>
            Batal
          </button>
          <button onClick={handleSave} disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Menyimpan...</> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal Edit
// ─────────────────────────────────────────────
function ModalEdit({ data, onClose, onSaved, onError }) {
  const [form, setForm] = useState({ ...data });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      await api.put(`/pemilih/${form.id}`, form);
      onSaved();
    } catch (err) {
      const msg = apiErrorMessage(err, 'Gagal menyimpan data.');
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const f = { form, onChange: handleChange };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#f96c00' }}>
          <div>
            <h3 className="font-bold text-gray-800">Edit Data Pemilih</h3>
            <p className="text-xs text-gray-500">NIK: {data.nik}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field {...f} label="No." name="no" type="number" />
            <Field {...f} label="No. TPS" name="no_tps" placeholder="cth: 1" />
          </div>
          <Field {...f} label="Nama Pemilih" name="nama" required placeholder="cth: BUDI SANTOSO" />
          <Field {...f} label="NIK" name="nik" required placeholder="cth: 3327030404760011" />
          <Field {...f} label="Jenis Kelamin" name="jenis_kelamin" options={[
            { value: 'L', label: 'Laki-laki' },
            { value: 'P', label: 'Perempuan' },
          ]} />
          <div className="grid grid-cols-2 gap-3">
            <Field {...f} label="Tempat Lahir" name="tempat_lahir" placeholder="cth: PEMALANG" />
            <Field {...f} label="Tanggal Lahir" name="tanggal_lahir" type="date" />
          </div>
          <Field {...f} label="Alamat Dusun" name="alamat_dusun" placeholder="cth: Dusun Krajan" />
          <div className="grid grid-cols-2 gap-3">
            <Field {...f} label="RT" name="alamat_rt" placeholder="cth: 01" />
            <Field {...f} label="RW" name="alamat_rw" placeholder="cth: 02" />
          </div>
          <Field {...f} label="Keterangan" name="keterangan" placeholder="cth: DPS" />
        </div>

        {error && (
          <div className="mx-6 mb-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 font-medium">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-3xl">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            style={{ borderColor: '#e5e7eb' }}>
            Batal
          </button>
          <button onClick={handleSave} disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Menyimpan...</> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal Import Preview
// ─────────────────────────────────────────────
function ModalImport({ rows, onConfirm, onClose, importing }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="font-bold text-gray-800">Preview Data Import</h3>
            <p className="text-xs text-gray-500">{rows.length} baris data ditemukan dari file Excel</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500">
            ✕
          </button>
        </div>

        <div className="overflow-auto flex-1 p-6">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="tbl-header">
                {['No', 'Nama', 'NIK', 'JK', 'Tempat Lahir', 'Tgl Lahir', 'Dusun', 'RT', 'RW', 'TPS', 'Keterangan'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 border-b border-gray-100">{r.no}</td>
                  <td className="px-3 py-2 border-b border-gray-100 whitespace-nowrap">{r.nama}</td>
                  <td className="px-3 py-2 border-b border-gray-100 font-mono">{r.nik}</td>
                  <td className="px-3 py-2 border-b border-gray-100">
                    <span className={r.jenis_kelamin === 'L' ? 'badge-lk' : 'badge-pr'}>
                      {r.jenis_kelamin === 'L' ? '♂ L' : '♀ P'}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100">{r.tempat_lahir}</td>
                  <td className="px-3 py-2 border-b border-gray-100">{r.tanggal_lahir}</td>
                  <td className="px-3 py-2 border-b border-gray-100">{r.alamat_dusun}</td>
                  <td className="px-3 py-2 border-b border-gray-100">{r.alamat_rt}</td>
                  <td className="px-3 py-2 border-b border-gray-100">{r.alamat_rw}</td>
                  <td className="px-3 py-2 border-b border-gray-100">{r.no_tps || '-'}</td>
                  <td className="px-3 py-2 border-b border-gray-100">{r.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-3xl">
          <button onClick={onClose} disabled={importing}
            className="flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Batal
          </button>
          <button onClick={onConfirm} disabled={importing}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
            {importing
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Mengimport...</>
              : `Import ${rows.length} Data`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pemilih, setPemilih] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editData, setEditData] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [importRows, setImportRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const perPage = 10;

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/pemilih');
      setPemilih(res.data.data || []);
    } catch (err) {
      showNotif('Gagal memuat data.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Excel import
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'binary', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false, blankrows: false });

        // Cari baris header (mengandung "No"/"Nama"/"NIK") — lewati judul & header bertingkat
        const headerIdx = raw.findIndex((r) => {
          const cells = r.map((c) => String(c || '').toLowerCase().trim());
          return cells.some((c) => c === 'nik' || c.includes('nik'))
            && cells.some((c) => c.includes('nama') || c === 'no');
        });

        // Gabungkan header utama + sub-header (baris setelah header) untuk deteksi kolom
        const headerRow = headerIdx >= 0 ? raw[headerIdx] : [];
        const subHeaderRow = headerIdx >= 0 ? (raw[headerIdx + 1] || []) : [];
        const col = mapColumnIndexes(headerRow, subHeaderRow);

        // Ambil hanya baris data setelah header (+ sub-header jika ada)
        const dataStart = headerIdx >= 0
          ? headerIdx + 1 + (subHeaderRow.some((c) => String(c || '').trim()) ? 1 : 0)
          : 0;
        const dataRaw = headerIdx >= 0 ? raw.slice(dataStart) : raw;

        const rows = dataRaw
          .map((r) => ({
            no: r[col.no] || '',
            nama: String(r[col.nama] || '').trim(),
            nik: String(r[col.nik] || '').trim().replace(/\.0$/, ''),
            jenis_kelamin: String(r[col.jk] || '').toUpperCase().startsWith('L') ? 'L' : 'P',
            tempat_lahir: r[col.tempat] || '',
            tanggal_lahir: formatTanggal(r[col.tanggal]),
            alamat_dusun: r[col.dusun] || '',
            alamat_rt: padRtRw(r[col.rt]),
            alamat_rw: padRtRw(r[col.rw]),
            no_tps: cleanTps(r[col.tps]),
            keterangan: r[col.keterangan] === '-' ? '' : (r[col.keterangan] || ''),
          }))
          // Hanya baris data valid: nama + NIK 16 digit
          .filter((r) => r.nama && /^\d{16}$/.test(r.nik));

        if (rows.length === 0) {
          showNotif('Tidak ada baris data valid ditemukan di file Excel.', 'error');
          return;
        }
        setImportRows(rows);
      } catch {
        showNotif('Gagal membaca file Excel. Pastikan format file valid.', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Deteksi indeks kolom dari baris header (utama + sub-header).
  // Default mengikuti format lama; kolom "No. TPS" dicari di sebelah kanan RW.
  function mapColumnIndexes(headerRow, subHeaderRow) {
    const main = headerRow.map((c) => String(c || '').toLowerCase().trim());
    const sub = subHeaderRow.map((c) => String(c || '').toLowerCase().trim());
    const findIn = (rows, pred) => {
      for (const row of rows) {
        const i = row.findIndex(pred);
        if (i >= 0) return i;
      }
      return -1;
    };
    const findHeader = (...keys) => {
      let i = findIn([main, sub], (c) => keys.some((k) => c === k || c.includes(k)));
      if (i < 0) i = findIn([main, sub], (c) => keys.some((k) => c.includes(k)));
      return i;
    };

    // TPS: cari spesifik di sub-header/header ("tps", "no. tps")
    let tps = findIn([sub, main], (c) => c.includes('tps'));

    // Jika TPS tidak ada di header, fallback: kolom setelah RW (format baru)
    const rw = findHeader('rw');
    if (tps < 0 && rw >= 0) {
      // Hanya pakai fallback jika kolom setelah RW bukan "keterangan"
      const afterRw = rw + 1;
      const afterRwLabel = main[afterRw] || sub[afterRw] || '';
      if (!afterRwLabel.includes('keterangan')) {
        tps = afterRw;
      }
    }

    // Keterangan: cari dulu; jika tidak ada dan ada TPS, pakai kolom setelah TPS
    let keterangan = findHeader('keterangan');
    if (keterangan < 0 && tps >= 0) keterangan = tps + 1;

    return {
      no: findHeader('no.', 'no', 'nomor') >= 0 ? findHeader('no.', 'no', 'nomor') : 0,
      nama: findHeader('nama') >= 0 ? findHeader('nama') : 1,
      nik: findHeader('nik') >= 0 ? findHeader('nik') : 2,
      jk: findHeader('jenis kelamin', 'jenis', 'jk', 'kelamin') >= 0
        ? findHeader('jenis kelamin', 'jenis', 'jk', 'kelamin') : 3,
      tempat: findHeader('tempat') >= 0 ? findHeader('tempat') : 4,
      tanggal: findHeader('tanggal') >= 0 ? findHeader('tanggal') : 5,
      dusun: findHeader('dusun') >= 0 ? findHeader('dusun') : 6,
      rt: findHeader('rt') >= 0 ? findHeader('rt') : 7,
      rw: rw >= 0 ? rw : 8,
      tps: tps >= 0 ? tps : -1, // -1 = tidak ada kolom TPS
      keterangan: keterangan >= 0 ? keterangan : (tps >= 0 ? tps + 1 : 9),
    };
  }

  function cleanTps(val) {
    const s = String(val || '').trim().replace(/\.0$/, '');
    if (!s || s === '-') return '';
    // Buang prefix "TPS" jika ada, ambil angka saja bila numeric
    const m = s.match(/(\d+)/);
    return m ? m[1] : s;
  }

  function padRtRw(val) {
    const s = String(val || '').trim().replace(/\.0$/, '');
    if (!s) return '';
    return s.padStart(3, '0');
  }

  function formatTanggal(val) {
    if (val === '' || val == null) return '';
    const s = String(val).trim();
    // dd-mm-yyyy / dd/mm/yyyy
    const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // Excel serial date
    const n = Number(s);
    if (!Number.isNaN(n) && n > 20000 && n < 60000) {
      const date = new Date((n - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    return s;
  }

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      // Dedup by NIK sebelum kirim — preview tampil semua, DB tetap tanpa duplikat
      const seen = new Set();
      const uniqueRows = importRows.filter((r) => {
        if (seen.has(r.nik)) return false;
        seen.add(r.nik);
        return true;
      });
      const res = await api.post('/pemilih/import', { data: uniqueRows });
      const { inserted, skipped } = res.data;
      const fileDup = importRows.length - uniqueRows.length;
      const totalSkipped = skipped + fileDup;
      showNotif(`${inserted} data berhasil diimport. ${totalSkipped} data dilewati (duplikat NIK).`);
      setImportRows(null);
      fetchData();
    } catch (err) {
      showNotif('Gagal mengimport data.', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Delete
  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus data pemilih "${nama}"?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/pemilih/${id}`);
      showNotif('Data berhasil dihapus.');
      fetchData();
    } catch {
      showNotif('Gagal menghapus data.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // Filter & Paginate
  const filtered = pemilih.filter(p =>
    [p.nama, p.nik, p.alamat_dusun, p.no_tps].some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Stats
  const totalL = pemilih.filter(p => p.jenis_kelamin === 'L').length;
  const totalP = pemilih.filter(p => p.jenis_kelamin === 'P').length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-fade-in-up
          ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
          {notification.msg}
        </div>
      )}

      {/* Topbar */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/logo-kabupaten-pemalang.png" alt="Logo Kabupaten Pemalang" className="w-9 h-9 object-contain drop-shadow-sm" />
            <div>
              <p className="text-xs text-gray-500">Admin Panel</p>
              <p className="text-sm font-bold text-gray-800">DPT · Sodong Basari 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="hidden sm:flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500 transition-colors">
              * Halaman Publik
            </a>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Login sebagai</p>
              <p className="text-sm font-semibold text-gray-700">{user?.name}</p>
            </div>
            <button onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold rounded-xl border-2 text-red-500 border-red-200 hover:bg-red-50 transition-all">
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Statistik Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Pemilih', value: pemilih.length, icon: '#', color: '#f96c00', bg: '#fff4ee' },
            { label: 'Laki-laki', value: totalL, icon: 'M', color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Perempuan', value: totalP, icon: 'F', color: '#ec4899', bg: '#fdf2f8' },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: bg, color }}>
                {icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-3xl font-bold" style={{ color }}>{loading ? '...' : value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabel Pemilih */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b">
            <h2 className="text-base font-bold text-gray-800">Daftar Pemilih Tetap</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Cari nama, NIK, dusun..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-orange-400" />
              </div>
              {/* Isi Manual Button */}
              <button type="button" onClick={() => setShowAdd(true)}
                className="text-sm text-center cursor-pointer flex items-center gap-2 py-2.5 px-4 whitespace-nowrap rounded-xl font-semibold text-white transition-all hover:opacity-80"
                style={{ background: '#f96c00' }}>
                ✎ Isi Manual
              </button>
              {/* Import Button */}
              <label className="btn-primary text-sm text-center cursor-pointer flex items-center gap-2 py-2.5 px-4 whitespace-nowrap">
                ↑ Import Excel
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="tbl-header text-left">
                  {['No', 'Nama Pemilih', 'NIK', 'JK', 'Dusun', 'RT/RW', 'No. TPS', 'Keterangan', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-400 text-sm">Memuat data...</p>
                    </div>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12">
                    <div className="text-4xl mb-2 font-bold text-gray-300">-</div>
                    <p className="text-gray-400 text-sm">{search ? 'Data tidak ditemukan.' : 'Belum ada data pemilih. Isi Manual atau Import Excel untuk memulai.'}</p>
                  </td></tr>
                ) : paginated.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-gray-50 hover:bg-orange-50/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.no || (currentPage - 1) * perPage + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap max-w-40 truncate">{p.nama}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.nik}</td>
                    <td className="px-4 py-3">
                      <span className={p.jenis_kelamin === 'L' ? 'badge-lk' : 'badge-pr'}>
                        {p.jenis_kelamin === 'L' ? '♂ L' : '♀ P'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.alamat_dusun || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.alamat_rt}/{p.alamat_rw}</td>
                    <td className="px-4 py-3">
                      {p.no_tps ? (
                        <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: '#f96c00' }}>
                          TPS {p.no_tps}
                        </span>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.keterangan || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditData(p)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-80"
                          style={{ background: '#f96c00' }}>
                           Edit
                        </button>
                        <button onClick={() => handleDelete(p.id, p.nama)}
                          disabled={deleting === p.id}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-red-500 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t">
              <p className="text-xs text-gray-500">
                Menampilkan {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} dari {filtered.length} data
              </p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${page === currentPage ? 'text-white' : 'border-gray-200 hover:bg-gray-50'}`}
                      style={page === currentPage ? { background: '#f96c00', borderColor: '#f96c00' } : {}}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Isi Manual */}
      {showAdd && (
        <ModalAdd
          nextNo={(() => {
            const maxNo = pemilih.reduce((m, p) => Math.max(m, Number(p.no) || 0), 0);
            return maxNo + 1;
          })()}
          onClose={() => setShowAdd(false)}
          onError={(msg) => showNotif(msg, 'error')}
          onSaved={() => {
            setShowAdd(false);
            showNotif('Data berhasil ditambahkan!');
            fetchData();
          }} />
      )}

      {/* Modal Edit */}
      {editData && (
        <ModalEdit data={editData} onClose={() => setEditData(null)} onError={(msg) => showNotif(msg, 'error')} onSaved={() => {
          setEditData(null);
          showNotif('Data berhasil disimpan!');
          fetchData();
        }} />
      )}

      {/* Modal Import Preview */}
      {importRows && (
        <ModalImport rows={importRows} importing={importing}
          onClose={() => setImportRows(null)}
          onConfirm={handleConfirmImport} />
      )}
    </div>
  );
}
