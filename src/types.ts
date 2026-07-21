export interface Pejabat {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  peran: 'PPK' | 'Bendahara' | 'PPTK' | 'Kadis' | 'Rekanan' | 'Lainnya';
  instansi?: string;
  alamat?: string;
}

export interface RekeningAnggaran {
  id: string;
  kode: string;
  uraian: string;
  pagu: number;
  realisasi: number;
  sumberDana: string;
}

export interface PajakDeduction {
  ppn: number;      // PPN 11%
  pph21: number;    // PPh 21
  pph22: number;    // PPh 22 (1.5%)
  pph23: number;    // PPh 23 (2.0%)
  daerah: number;   // Pajak Daerah
}

export interface Dokumen {
  id: string;
  jenis: 'Kwitansi' | 'BAP' | 'NPD' | 'SPJ';
  nomor: string;
  tanggal: string; // YYYY-MM-DD
  nilai: number;
  terbilang: string;
  uraian: string;
  
  // Kwitansi / BAP Specific fields
  ppkId?: string;
  bendaharaId?: string;
  rekananId?: string;
  kadisId?: string;
  
  // Kontrak & SPMK
  noKontrak?: string;
  tglKontrak?: string;
  noSPMK?: string;
  tglSPMK?: string;
  noBAST?: string;
  tglBAST?: string;
  
  // BAP details
  nilaiKontrak?: number;
  potonganLain?: number;
  keteranganPotongan?: string;

  // NPD Specific fields
  pptkId?: string;
  rekeningId?: string; // Link to RekeningAnggaran
  noNPD?: string;
  tglNPD?: string;

  // Taxes
  pajak: PajakDeduction;
  totalPajak: number;
}

export interface CatatanPajak {
  id: string;
  dokumenId?: string;
  noBukti: string;
  tanggal: string;
  kodeRekening: string;
  uraian: string;
  ppn: number;
  pph21: number;
  pph22: number;
  pph23: number;
  daerah: number;
  total: number;
  pihakMenerima: string;
}
