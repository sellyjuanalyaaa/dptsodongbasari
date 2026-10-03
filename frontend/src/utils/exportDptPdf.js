// Export Daftar Pemilih Tetap (DPT) ke PDF lewat dialog print browser
// ("Save as PDF"), dengan format mengikuti blanko:
//   BLANKO DAFTAR PEMILIH TETAP 2026.docx
// Kertas Folio/F4 (216 x 330 mm), font Bookman Old Style.

const FILE_NAME = 'Daftar_Pemilih_Tetap_2026';

const TITLE_LINES = [
  'DAFTAR PEMILIH TETAP',
  'PEMILIHAN KEPALA DESA',
  'DESA SODONG BASARI KECAMATAN BELIK TAHUN 2026',
];

// Jumlah baris data per halaman (sesuai blanko: 27 baris kosong)
const PER_PAGE = 27;
// Jika halaman terakhir berisi <= n baris, blok tanda tangan ditumpuk
// di halaman itu. Lewat dari itu, tanda tangan dapat halaman sendiri
// (seperti blanko yang memberi page break sebelum blok panitia).
const SIGN_INLINE_LIMIT = 24;

// Lebar kolom (mm) — total 175 mm = lebar isi kertas F4
// (216 - margin kiri 25 - margin kanan 16)
const COL_WIDTHS = [9, 32, 27, 13, 18, 17, 29, 7, 7, 16];

const SIGNATURE = [
  { jabatan: 'KETUA', nama: 'SUNARYO, S.Pd.' },
  { jabatan: 'SEKRETARIS', nama: 'TYO ANWAR MUJAHIDIN, A.Md.' },
];

const esc = (v) =>
  String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Nama dokumen (otomatis jadi nama file "Save as PDF")
function docFileName(options = {}) {
  const suffix = String(options.suffix || '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '');
  return suffix ? `${FILE_NAME}_${suffix}` : FILE_NAME;
}

// '1986-10-27T00:00:00.000000Z' / '1986-10-27' -> '27-10-1986'
function formatTanggal(value) {
  const s = String(value || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}

function colgroup() {
  return `<colgroup>${COL_WIDTHS.map((w) => `<col style="width:${w}mm">`).join('')}</colgroup>`;
}

function titleHtml(label) {
  const sub = label ? `<p class="sub">${esc(label)}</p>` : '';
  return `<div class="judul">${TITLE_LINES.map((t) => `<p>${esc(t)}</p>`).join('')}${sub}</div>`;
}

function theadHtml() {
  return `<thead>
    <tr>
      <th class="c" rowspan="2">NO</th>
      <th class="c" rowspan="2">NAMA PEMILIH</th>
      <th class="c" rowspan="2">NIK</th>
      <th class="c" rowspan="2">Jenis<br>kelamin</th>
      <th colspan="2">LAHIR</th>
      <th colspan="3">ALAMAT</th>
      <th class="c" rowspan="2">KET</th>
    </tr>
    <tr>
      <th class="c">TEMPAT</th>
      <th class="c">TANGGAL</th>
      <th class="c">DUSUN</th>
      <th class="c">RT</th>
      <th class="c">RW</th>
    </tr>
  </thead>`;
}

function keterangan(p) {
  const parts = [p.keterangan, p.no_tps ? `TPS ${p.no_tps}` : '']
    .map((s) => String(s || '').trim())
    .filter((s) => s && s !== '-');
  return parts.join(' · ');
}

function dataRowHtml(p, index) {
  return `<tr>
    <td class="c">${esc(p.no || index + 1)}</td>
    <td class="l">${esc(p.nama)}</td>
    <td class="c nik">${esc(p.nik)}</td>
    <td class="c">${p.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
    <td class="l">${esc(p.tempat_lahir)}</td>
    <td class="c">${esc(formatTanggal(p.tanggal_lahir))}</td>
    <td class="l">${esc(p.alamat_dusun)}</td>
    <td class="c">${esc(p.alamat_rt)}</td>
    <td class="c">${esc(p.alamat_rw)}</td>
    <td class="c ket">${esc(keterangan(p))}</td>
  </tr>`;
}

// 3 baris ringkasan persis blanko:
// "Jumlah Halaman ini" / "Jumlah s/d Halaman sebelumnya" / "Jumlah s/d halaman ini"
function summaryHtml(pageCount, before, after) {
  const rows = [
    ['Jumlah Halaman ini', pageCount],
    ['Jumlah s/d Halaman sebelumnya', before],
    ['Jumlah s/d halaman ini', after],
  ];
  return rows
    .map(([label, value], i) => {
      const cls = i === 0 ? 'sum first' : 'sum';
      return `<tr class="${cls}">
      <td></td><td></td><td></td><td></td>
      <td colspan="2"></td>
      <td colspan="3" class="lbl">${label}</td>
      <td class="val">${value}</td>
    </tr>`;
    })
    .join('');
}

function signatureHtml(withSpacing) {
  const cells = SIGNATURE.map(
    (s) => `<td>
      <span class="jab">${esc(s.jabatan)}</span>
      <span class="gap"></span>
      <span class="nm">${esc(s.nama)}</span>
    </td>`
  ).join('');
  return `<div class="ttd${withSpacing ? ' ttd-top' : ''}">
    <p>PANITIA PEMILIHAN KEPALA DESA SODONG BASARI</p>
    <p>KECAMATAN BELIK</p>
    <table class="ttd-tbl"><tbody><tr>${cells}</tr></tbody></table>
  </div>`;
}

function styles() {
  return `<style>
    @page { size: 216mm 330mm; margin: 25mm 16mm 15mm 25mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: "Bookman Old Style", "URW Bookman L", Georgia, "Times New Roman", serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      page-break-after: always;
      break-after: page;
    }
    .page:last-child { page-break-after: auto; break-after: auto; }

    .judul { text-align: center; margin: 0 0 4mm; }
    .judul p { margin: 0; font-size: 12pt; line-height: 1.3; }
    .judul .sub { font-size: 9pt; margin-top: 1.5mm; letter-spacing: 0.4pt; }

    table.dpt {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 7pt;
      line-height: 1.15;
    }
    table.dpt th, table.dpt td {
      border: 1px solid #000;
      padding: 0.5mm 1mm;
      vertical-align: middle;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    table.dpt th {
      height: 7.4mm;
      font-size: 7.5pt;
      font-weight: bold;
      text-align: center;
      padding: 0.5mm 0.6mm;
    }
    table.dpt td { height: 7.4mm; }
    .c { text-align: center; }
    .l { text-align: left; }
    .nik { font-size: 7pt; letter-spacing: -0.1pt; }
    .ket { font-size: 6.5pt; }

    tr.sum td { border: none; height: 7.4mm; }
    tr.sum.first td:not(.lbl):not(.val) { border-top: 1px solid #000; }
    tr.sum td.lbl, tr.sum td.val { border: 1px solid #000; }
    td.lbl { text-align: left; padding-left: 2mm; font-size: 6.5pt; }
    td.val { text-align: center; font-size: 7.5pt; }

    .ttd { margin-top: 8mm; text-align: center; }
    .ttd.ttd-top { margin-top: 18mm; }
    .ttd p { margin: 0; font-size: 12pt; line-height: 1.35; }
    .ttd-tbl {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6mm;
      table-layout: fixed;
    }
    .ttd-tbl td {
      width: 50%;
      padding: 0;
      text-align: center;
      vertical-align: top;
      font-size: 12pt;
      line-height: 1.35;
    }
    .ttd-tbl .jab, .ttd-tbl .nm { display: block; }
    .ttd-tbl .gap { display: block; height: 17mm; }
  </style>`;
}

/**
 * Susun data pemilih menjadi HTML siap cetak.
 * @param {Array} rows data yang mau diexport (bisa seluruh data atau hasil filter)
 * @param {object} [options] { label: string tampil di bawah judul, suffix: string untuk nama file }
 * @returns {string|null} HTML lengkap, atau null bila tidak ada data
 */
export function buildDptHtml(rows, options = {}) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) return null;

  const pages = [];
  for (let i = 0; i < list.length; i += PER_PAGE) pages.push(list.slice(i, i + PER_PAGE));

  let before = 0;
  let html = '';

  pages.forEach((page, pi) => {
    const count = page.length;
    const isLast = pi === pages.length - 1;
    const inlineSign = isLast && count <= SIGN_INLINE_LIMIT;
    const rowStart = before;
    before += count;

    html += `<div class="page">
      ${titleHtml(options.label || '')}
      <table class="dpt">
        ${colgroup()}
        ${theadHtml()}
        <tbody>
          ${page.map((p, k) => dataRowHtml(p, rowStart + k)).join('')}
          ${summaryHtml(count, rowStart, before)}
        </tbody>
      </table>
      ${inlineSign ? signatureHtml(false) : ''}
    </div>`;
  });

  // Halaman tanda tangan terpisah bila halaman terakhir penuh
  if (pages[pages.length - 1].length > SIGN_INLINE_LIMIT) {
    html += `<div class="page">${signatureHtml(true)}</div>`;
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${esc(docFileName(options))}</title>
  ${styles()}
</head>
<body>
${html}
</body>
</html>`;
}

function whenReady(win, callback) {
  let tries = 0;
  const tick = () => {
    if (!win || win.closed) return;
    if (win.document && win.document.readyState === 'complete') {
      callback();
      return;
    }
    if (++tries > 80) {
      callback();
      return;
    }
    setTimeout(tick, 50);
  };
  setTimeout(tick, 150);
}

/**
 * Buka preview cetak (default: Save as PDF) untuk data pemilih yang diberikan.
 * @param {Array} rows data (seluruh data atau hasil filter)
 * @param {object} [options] { label, suffix }
 * @returns {boolean} false bila tidak ada data
 */
export function exportDptPdf(rows, options = {}) {
  const html = buildDptHtml(rows, options);
  if (!html) return false;
  const fileName = docFileName(options);

  // Utama: jendela baru (isolasi dari CSS aplikasi, nama file = judul dokumen)
  const win = window.open('', '_blank');
  if (win) {
    try {
      win.document.open();
      win.document.write(html);
      win.document.close();
    } catch {
      /* jatuh ke fallback iframe di bawah */
    }
    if (win.document && win.document.body) {
      whenReady(win, () => {
        try {
          win.focus();
        } catch {
          /* abaikan */
        }
        try {
          win.addEventListener(
            'afterprint',
            () => {
              setTimeout(() => {
                try {
                  win.close();
                } catch {
                  /* abaikan */
                }
              }, 500);
            },
            { once: true }
          );
        } catch {
          /* abaikan */
        }
        win.print();
      });
      return true;
    }
  }

  // Fallback: popup diblokir — cetak lewat iframe tersembunyi
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText =
    'position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:0;border:0;visibility:hidden;';
  document.body.appendChild(frame);

  const frameDoc = frame.contentWindow.document;
  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const previousTitle = document.title;
  document.title = fileName;

  whenReady(frame.contentWindow, () => {
    try {
      frame.contentWindow.focus();
    } catch {
      /* abaikan */
    }
    frame.contentWindow.print();
    setTimeout(() => {
      document.title = previousTitle;
      frame.remove();
    }, 1000);
  });

  return true;
}
