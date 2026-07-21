import { RekeningAnggaran, Dokumen, CatatanPajak, Pejabat } from '../types';

const SPREADSHEET_NAME = 'SIPD PUPR Nagekeo 2026';

/**
 * Searches for an existing spreadsheet named 'SIPD PUPR Nagekeo 2026' in the user's Google Drive.
 * Returns the spreadsheetId if found, otherwise null.
 */
export async function searchSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Google Drive API error: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error searching spreadsheet:', error);
    throw error;
  }
}

/**
 * Creates a brand new spreadsheet named 'SIPD PUPR Nagekeo 2026' with pre-configured sheets.
 * Returns the created spreadsheetId.
 */
export async function createSpreadsheet(accessToken: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const body = {
    properties: {
      title: SPREADSHEET_NAME,
    },
    sheets: [
      { properties: { title: 'Rekening Anggaran' } },
      { properties: { title: 'Arsip Dokumen' } },
      { properties: { title: 'Buku Pembantu Pajak' } },
      { properties: { title: 'Database Pejabat' } },
    ],
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Google Sheets API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.spreadsheetId;
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

/**
 * Formats values to match Google Sheets format.
 */
function prepareValuesForRekening(rekening: RekeningAnggaran[]): any[][] {
  const header = ['ID', 'Kode Rekening', 'Uraian Belanja', 'Pagu Anggaran (Rp)', 'Realisasi Belanja (Rp)', 'Sisa Anggaran (Rp)', 'Sumber Dana'];
  const rows = rekening.map(item => [
    item.id,
    item.kode,
    item.uraian,
    item.pagu,
    item.realisasi,
    item.pagu - item.realisasi,
    item.sumberDana
  ]);
  return [header, ...rows];
}

function prepareValuesForDokumen(dokumen: Dokumen[]): any[][] {
  const header = [
    'ID', 'Jenis Dokumen', 'Nomor Dokumen', 'Tanggal', 'Nilai Pembayaran (Rp)', 'Terbilang', 'Uraian',
    'No Kontrak', 'Tgl Kontrak', 'No SPMK', 'Tgl SPMK', 'No BAST', 'Tgl BAST', 'Nilai Kontrak',
    'PPK ID', 'Bendahara ID', 'Rekanan ID', 'Kadis ID', 'PPTK ID', 'Rekening ID',
    'PPN', 'PPh 21', 'PPh 22', 'PPh 23', 'Pajak Daerah', 'Total Potongan Pajak'
  ];
  const rows = dokumen.map(doc => [
    doc.id,
    doc.jenis,
    doc.nomor,
    doc.tanggal,
    doc.nilai,
    doc.terbilang,
    doc.uraian,
    doc.noKontrak || '',
    doc.tglKontrak || '',
    doc.noSPMK || '',
    doc.tglSPMK || '',
    doc.noBAST || '',
    doc.tglBAST || '',
    doc.nilaiKontrak || 0,
    doc.ppkId || '',
    doc.bendaharaId || '',
    doc.rekananId || '',
    doc.kadisId || '',
    doc.pptkId || '',
    doc.rekeningId || '',
    doc.pajak.ppn,
    doc.pajak.pph21,
    doc.pajak.pph22,
    doc.pajak.pph23,
    doc.pajak.daerah,
    doc.totalPajak
  ]);
  return [header, ...rows];
}

function prepareValuesForPajak(pajak: CatatanPajak[]): any[][] {
  const header = [
    'ID', 'Dokumen ID', 'Nomor Bukti', 'Tanggal', 'Kode Rekening', 'Uraian Potongan',
    'PPN', 'PPh 21', 'PPh 22', 'PPh 23', 'Pajak Daerah', 'Total Pajak', 'Pihak Menerima'
  ];
  const rows = pajak.map(item => [
    item.id,
    item.dokumenId || '',
    item.noBukti,
    item.tanggal,
    item.kodeRekening,
    item.uraian,
    item.ppn,
    item.pph21,
    item.pph22,
    item.pph23,
    item.daerah,
    item.total,
    item.pihakMenerima
  ]);
  return [header, ...rows];
}

function prepareValuesForPejabat(pejabat: Pejabat[]): any[][] {
  const header = ['ID', 'Nama Lengkap', 'NIP', 'Jabatan / Uraian Peran', 'Kategori Peran', 'Instansi / Perusahaan', 'Alamat'];
  const rows = pejabat.map(item => [
    item.id,
    item.nama,
    item.nip,
    item.jabatan,
    item.peran,
    item.instansi || '',
    item.alamat || ''
  ]);
  return [header, ...rows];
}

/**
 * Overwrites the entire spreadsheet content with the current application state.
 */
export async function syncToSheets(
  accessToken: string,
  spreadsheetId: string,
  data: {
    rekening: RekeningAnggaran[];
    dokumen: Dokumen[];
    pajak: CatatanPajak[];
    pejabat: Pejabat[];
  }
): Promise<void> {
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  
  const payload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Rekening Anggaran'!A1:G1000",
        values: prepareValuesForRekening(data.rekening)
      },
      {
        range: "'Arsip Dokumen'!A1:Z1000",
        values: prepareValuesForDokumen(data.dokumen)
      },
      {
        range: "'Buku Pembantu Pajak'!A1:M1000",
        values: prepareValuesForPajak(data.pajak)
      },
      {
        range: "'Database Pejabat'!A1:G1000",
        values: prepareValuesForPejabat(data.pejabat)
      }
    ]
  };

  try {
    // Before batchUpdate, let's make sure the sheets are cleared so old rows are not left hanging if the new size is smaller.
    await clearSheet(accessToken, spreadsheetId, "'Rekening Anggaran'!A1:G1000");
    await clearSheet(accessToken, spreadsheetId, "'Arsip Dokumen'!A1:Z1000");
    await clearSheet(accessToken, spreadsheetId, "'Buku Pembantu Pajak'!A1:M1000");
    await clearSheet(accessToken, spreadsheetId, "'Database Pejabat'!A1:G1000");

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gagal menulis ke Google Sheets: ${errText}`);
    }
  } catch (error) {
    console.error('Error in syncToSheets:', error);
    throw error;
  }
}

async function clearSheet(accessToken: string, spreadsheetId: string, range: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

/**
 * Pulls the spreadsheet data back into the application.
 */
export async function pullFromSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  rekening: RekeningAnggaran[];
  dokumen: Dokumen[];
  pajak: CatatanPajak[];
  pejabat: Pejabat[];
} | null> {
  const ranges = ["'Rekening Anggaran'!A1:G1000", "'Arsip Dokumen'!A1:Z1000", "'Buku Pembantu Pajak'!A1:M1000", "'Database Pejabat'!A1:G1000"];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges.map(r => encodeURIComponent(r)).join('&')}&valueRenderOption=UNFORMATTED_VALUE`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Google Sheets API batchGet error: ${res.statusText}`);
    }

    const data = await res.json();
    const valueRanges = data.valueRanges || [];

    const rekeningValues = valueRanges[0]?.values || [];
    const dokumenValues = valueRanges[1]?.values || [];
    const pajakValues = valueRanges[2]?.values || [];
    const pejabatValues = valueRanges[3]?.values || [];

    // Parse Rekening Anggaran
    const rekening: RekeningAnggaran[] = [];
    if (rekeningValues.length > 1) {
      for (let i = 1; i < rekeningValues.length; i++) {
        const row = rekeningValues[i];
        if (!row[0] || !row[1]) continue;
        rekening.push({
          id: String(row[0]),
          kode: String(row[1]),
          uraian: String(row[2] || ''),
          pagu: Number(row[3] || 0),
          realisasi: Number(row[4] || 0),
          sumberDana: String(row[6] || 'DAU')
        });
      }
    }

    // Parse Database Pejabat
    const pejabat: Pejabat[] = [];
    if (pejabatValues.length > 1) {
      for (let i = 1; i < pejabatValues.length; i++) {
        const row = pejabatValues[i];
        if (!row[0] || !row[1]) continue;
        pejabat.push({
          id: String(row[0]),
          nama: String(row[1]),
          nip: String(row[2] || '-'),
          jabatan: String(row[3] || ''),
          peran: (row[4] || 'Lainnya') as Pejabat['peran'],
          instansi: String(row[5] || ''),
          alamat: String(row[6] || '')
        });
      }
    }

    // Parse Arsip Dokumen
    const dokumen: Dokumen[] = [];
    if (dokumenValues.length > 1) {
      for (let i = 1; i < dokumenValues.length; i++) {
        const row = dokumenValues[i];
        if (!row[0] || !row[1]) continue;
        dokumen.push({
          id: String(row[0]),
          jenis: (row[1] || 'Kwitansi') as Dokumen['jenis'],
          nomor: String(row[2] || ''),
          tanggal: String(row[3] || ''),
          nilai: Number(row[4] || 0),
          terbilang: String(row[5] || ''),
          uraian: String(row[6] || ''),
          noKontrak: String(row[7] || ''),
          tglKontrak: String(row[8] || ''),
          noSPMK: String(row[9] || ''),
          tglSPMK: String(row[10] || ''),
          noBAST: String(row[11] || ''),
          tglBAST: String(row[12] || ''),
          nilaiKontrak: Number(row[13] || 0),
          ppkId: String(row[14] || ''),
          bendaharaId: String(row[15] || ''),
          rekananId: String(row[16] || ''),
          kadisId: String(row[17] || ''),
          pptkId: String(row[18] || ''),
          rekeningId: String(row[19] || ''),
          pajak: {
            ppn: Number(row[20] || 0),
            pph21: Number(row[21] || 0),
            pph22: Number(row[22] || 0),
            pph23: Number(row[23] || 0),
            daerah: Number(row[24] || 0),
          },
          totalPajak: Number(row[25] || 0)
        });
      }
    }

    // Parse Buku Pembantu Pajak
    const pajak: CatatanPajak[] = [];
    if (pajakValues.length > 1) {
      for (let i = 1; i < pajakValues.length; i++) {
        const row = pajakValues[i];
        if (!row[0] || !row[2]) continue;
        pajak.push({
          id: String(row[0]),
          dokumenId: String(row[1] || ''),
          noBukti: String(row[2] || ''),
          tanggal: String(row[3] || ''),
          kodeRekening: String(row[4] || ''),
          uraian: String(row[5] || ''),
          ppn: Number(row[6] || 0),
          pph21: Number(row[7] || 0),
          pph22: Number(row[8] || 0),
          pph23: Number(row[9] || 0),
          daerah: Number(row[10] || 0),
          total: Number(row[11] || 0),
          pihakMenerima: String(row[12] || '')
        });
      }
    }

    return { rekening, dokumen, pajak, pejabat };
  } catch (error) {
    console.error('Error in pullFromSheets:', error);
    throw error;
  }
}
