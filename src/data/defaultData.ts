import { Pejabat, RekeningAnggaran, Dokumen, CatatanPajak } from '../types';

export const DEFAULT_PEJABAT: Pejabat[] = [
  {
    id: 'pejabat-1',
    nama: 'FRANSISKUS P.G DADJO, ST, MT',
    nip: '19780325 201001 1 015',
    jabatan: 'Pejabat Pembuat Komitmen (PPK) Program Penyelenggaraan Jalan Kegiatan Pembangunan Jalan T.A. 2026',
    peran: 'PPK',
    instansi: 'Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo'
  },
  {
    id: 'pejabat-2',
    nama: 'FLORENTINA WONGA',
    nip: '19780822 200312 2 006',
    jabatan: 'Bendahara Pengeluaran Dinas PUPR Kab. Nagekeo',
    peran: 'Bendahara',
    instansi: 'Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo'
  },
  {
    id: 'pejabat-3',
    nama: 'SYARIFUDIN IBRAHIM, ST',
    nip: '19681102 199703 1 008',
    jabatan: 'Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo / Pengguna Anggaran',
    peran: 'Kadis',
    instansi: 'Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo',
    alamat: 'Mbay'
  },
  {
    id: 'pejabat-4',
    nama: 'YOHANES SAPA, ST',
    nip: '-',
    jabatan: 'Kepala Perwakilan CV. EL EMUNAH',
    peran: 'Rekanan',
    instansi: 'CV. EL EMUNAH',
    alamat: 'Jln. Pegangsaan II No. 9, Walikota Kupang'
  },
  {
    id: 'pejabat-5',
    nama: 'ANSELMUS MERE, SE',
    nip: '19740413 200901 1 007',
    jabatan: 'PPTK Program Penyelenggaraan Jalan / Pejabat Pelaksana Teknis Kegiatan',
    peran: 'PPTK',
    instansi: 'Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo'
  }
];

export const DEFAULT_REKENING: RekeningAnggaran[] = [
  {
    id: 'rek-1',
    kode: '1.03.10.2.01.0053.5.2.04.01.001.0003',
    uraian: 'Belanja Modal Jalan Kabupaten',
    pagu: 3980000000,
    realisasi: 99900000,
    sumberDana: 'DAU (Dana Alokasi Umum)'
  },
  {
    id: 'rek-2',
    kode: '1.03.02.02.0001.5.1.01.01.01.0001',
    uraian: 'Belanja Gaji Pokok PNS',
    pagu: 2844125000,
    realisasi: 2844125000,
    sumberDana: 'DAU'
  },
  {
    id: 'rek-3',
    kode: '1.03.02.02.0001.5.1.01.01.01.0002',
    uraian: 'Belanja Tunjangan Keluarga PNS',
    pagu: 434906000,
    realisasi: 434906000,
    sumberDana: 'DAU'
  },
  {
    id: 'rek-4',
    kode: '1.03.02.02.0001.5.1.01.01.01.0003',
    uraian: 'Belanja Tunjangan Anak PNS',
    pagu: 239641000,
    realisasi: 239641000,
    sumberDana: 'DAU'
  },
  {
    id: 'rek-5',
    kode: '1.03.02.02.0024.5.2.01.01.01.0024',
    uraian: 'Belanja ATK (Alat Tulis Kantor)',
    pagu: 12300000,
    realisasi: 12300000,
    sumberDana: 'DAU'
  },
  {
    id: 'rek-6',
    kode: '1.03.02.02.0025.5.2.01.01.01.0025',
    uraian: 'Belanja Kertas dan Cover',
    pagu: 10814000,
    realisasi: 10814000,
    sumberDana: 'DAU'
  },
  {
    id: 'rek-7',
    kode: '1.03.02.02.0004.5.2.01.01.01.0004',
    uraian: 'Belanja Bahan Cetak',
    pagu: 9300000,
    realisasi: 9300000,
    sumberDana: 'DAU'
  }
];

export const DEFAULT_DOKUMEN: Dokumen[] = [
  {
    id: 'dok-1',
    jenis: 'Kwitansi',
    nomor: '53.16/03.0/000097/LS/1.03.0.00.0.00.01.0000/P2/7/2026',
    tanggal: '2026-07-15',
    nilai: 99900000,
    terbilang: 'Sembilan Puluh Sembilan Juta Sembilan Ratus Ribu Rupiah',
    uraian: 'Pembayaran 100% atas Pekerjaan Belanja Jasa Konsultasi Perencanaan Teknis Jalan Kabupaten DAU 2026 Kepada CV.EL EMUNAH pada Dinas PUPR TA.2026 dari Dana DAU',
    ppkId: 'pejabat-1',
    bendaharaId: 'pejabat-2',
    rekananId: 'pejabat-4',
    kadisId: 'pejabat-3',
    pptkId: 'pejabat-5',
    rekeningId: 'rek-1',
    noKontrak: '620/DPUPR-NGK/PJ.DAU/02/V/2026',
    tglKontrak: '2026-05-04',
    noSPMK: '620/DPUPR-NGK/PJ.DAU/03/V/2026',
    tglSPMK: '2026-05-05',
    noBAST: '620/DPUPR-NGK/BAST-PPJ.DAU/05/VI/2026',
    tglBAST: '2026-06-29',
    nilaiKontrak: 99900000,
    pajak: {
      ppn: 4950000,
      pph21: 0,
      pph22: 60892,
      pph23: 5010892,
      daerah: 60892
    },
    totalPajak: 10082676
  }
];

export const DEFAULT_PAJAK: CatatanPajak[] = [
  {
    id: 'pj-1',
    dokumenId: 'dok-1',
    noBukti: '148/DPUPR-NGK/VI/2026',
    tanggal: '2026-07-15',
    kodeRekening: '1.03.10.2.01.0053.5.2.04.01.001.0003',
    uraian: 'Potongan Pajak Belanja Jasa Konsultasi CV. EL EMUNAH',
    ppn: 4950000,
    pph21: 0,
    pph22: 60892,
    pph23: 5010892,
    daerah: 60892,
    total: 10082676,
    pihakMenerima: 'CV. EL EMUNAH'
  }
];
