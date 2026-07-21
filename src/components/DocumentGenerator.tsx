import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Printer, 
  Plus, 
  Copy, 
  Trash2, 
  Edit, 
  Check, 
  Save, 
  User, 
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Stamp
} from 'lucide-react';
import { Dokumen, Pejabat, RekeningAnggaran } from '../types';
import { terbilang, formatRupiah, formatTanggalIndo } from '../utils/indonesianHelper';

interface DocumentGeneratorProps {
  dokumen: Dokumen[];
  pejabat: Pejabat[];
  rekening: RekeningAnggaran[];
  onAddDokumen: (doc: Dokumen) => void;
  onUpdateDokumen: (doc: Dokumen) => void;
  onDeleteDokumen: (id: string) => void;
  selectedExternalDokumen: Dokumen | null;
  onClearSelectedExternalDokumen: () => void;
}

const getGoogleDriveImageUrl = (link: string) => {
  if (!link) return '';
  const trimmed = link.trim();
  
  // Match file/d/FILE_ID
  const fileIdRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match1 = trimmed.match(fileIdRegex);
  if (match1 && match1[1]) {
    return `https://lh3.googleusercontent.com/d/${match1[1]}`;
  }
  
  // Match id=FILE_ID query param
  try {
    const urlObj = new URL(trimmed);
    const id = urlObj.searchParams.get('id');
    if (id) {
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
  } catch (e) {
    // ignore
  }
  
  // Direct file ID format
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }
  
  return trimmed;
};

export default function DocumentGenerator({
  dokumen,
  pejabat,
  rekening,
  onAddDokumen,
  onUpdateDokumen,
  onDeleteDokumen,
  selectedExternalDokumen,
  onClearSelectedExternalDokumen
}: DocumentGeneratorProps) {
  
  // Tab selecting
  const [activeDocType, setActiveDocType] = useState<'Kwitansi' | 'BAP' | 'NPD' | 'SPJ'>('Kwitansi');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Google Drive Logo & Stamp Toggle states
  const [logoLink, setLogoLink] = useState(() => {
    return localStorage.getItem('pupr_logo_link') || '';
  });
  const [showCap, setShowCap] = useState(false);
  const [showPrintHintModal, setShowPrintHintModal] = useState(false);

  // Form input states
  const [nomor, setNomor] = useState('');
  const [tanggal, setTanggal] = useState('2026-07-15');
  const [nilai, setNilai] = useState<number>(99900000);
  const [uraian, setUraian] = useState('Pembayaran 100% atas Pekerjaan Belanja Jasa Konsultasi Perencanaan Teknis Jalan Kabupaten DAU 2026 pada Dinas PUPR TA.2026 dari Dana DAU');
  
  // Officials bindings
  const [ppkId, setPpkId] = useState('');
  const [bendaharaId, setBendaharaId] = useState('');
  const [rekananId, setRekananId] = useState('');
  const [kadisId, setKadisId] = useState('');
  const [pptkId, setPptkId] = useState('');
  const [rekeningId, setRekeningId] = useState('');

  // Manual Rekanan details (if unselected or selected manual)
  const [manualRekananInstansi, setManualRekananInstansi] = useState('');
  const [manualRekananNama, setManualRekananNama] = useState('');
  const [manualRekananJabatan, setManualRekananJabatan] = useState('Kepala Perwakilan');
  const [manualRekananAlamat, setManualRekananAlamat] = useState('');

  // Dynamic Supporting Documents List
  const [supportingDocs, setSupportingDocs] = useState<{ id: string; label: string; nomor: string; tanggal: string }[]>(() => [
    { id: '1', label: 'KONTRAK', nomor: '620/DPUPR-NGK/PJ.DAU/02/V/2026', tanggal: '2026-05-04' },
    { id: '2', label: 'SPMK', nomor: '620/DPUPR-NGK/PJ.DAU/03/V/2026', tanggal: '2026-05-05' },
    { id: '3', label: 'BAST PERENCANAAN', nomor: '620/DPUPR-NGK/BAST-PPJ.DAU/05/VI/2026', tanggal: '2026-06-29' }
  ]);
  
  // Taxes
  const [taxPPN, setTaxPPN] = useState<number>(4950000);
  const [taxPPh21, setTaxPPh21] = useState<number>(0);
  const [taxPPh22, setTaxPPh22] = useState<number>(60892);
  const [taxPPh23, setTaxPPh23] = useState<number>(5010892);
  const [taxDaerah, setTaxDaerah] = useState<number>(60892);

  // Status message
  const [saveStatus, setSaveStatus] = useState('');

  // Populate form from external or selected document
  const populateForm = (doc: Dokumen) => {
    setActiveDocType(doc.jenis as 'Kwitansi' | 'BAP' | 'NPD' | 'SPJ');
    setSelectedDocId(doc.id);
    setNomor(doc.nomor);
    setTanggal(doc.tanggal);
    setNilai(doc.nilai);
    setUraian(doc.uraian);
    
    setPpkId(doc.ppkId || '');
    setBendaharaId(doc.bendaharaId || '');
    setRekananId(doc.rekananId || '');
    setKadisId(doc.kadisId || '');
    setPptkId(doc.pptkId || '');
    setRekeningId(doc.rekeningId || '');

    setManualRekananInstansi(doc.manualRekananInstansi || '');
    setManualRekananNama(doc.manualRekananNama || '');
    setManualRekananJabatan(doc.manualRekananJabatan || 'Kepala Perwakilan');
    setManualRekananAlamat(doc.manualRekananAlamat || '');

    const loadedDocs: { id: string; label: string; nomor: string; tanggal: string }[] = [];
    if (doc.supportingDocs && doc.supportingDocs.length > 0) {
      setSupportingDocs(doc.supportingDocs);
    } else {
      if (doc.noKontrak || doc.tglKontrak) {
        loadedDocs.push({ id: '1', label: 'KONTRAK', nomor: doc.noKontrak || '', tanggal: doc.tglKontrak || '' });
      }
      if (doc.noSPMK || doc.tglSPMK) {
        loadedDocs.push({ id: '2', label: 'SPMK', nomor: doc.noSPMK || '', tanggal: doc.tglSPMK || '' });
      }
      if (doc.noBAST || doc.tglBAST) {
        loadedDocs.push({ id: '3', label: 'BAST PERENCANAAN', nomor: doc.noBAST || '', tanggal: doc.tglBAST || '' });
      }
      setSupportingDocs(loadedDocs);
    }

    setTaxPPN(doc.pajak.ppn);
    setTaxPPh21(doc.pajak.pph21);
    setTaxPPh22(doc.pajak.pph22);
    setTaxPPh23(doc.pajak.pph23);
    setTaxDaerah(doc.pajak.daerah);
  };

  // Listen to external selection from Dashboard
  useEffect(() => {
    if (selectedExternalDokumen) {
      populateForm(selectedExternalDokumen);
      onClearSelectedExternalDokumen();
    }
  }, [selectedExternalDokumen]);

  // Initial Form Prefills if empty
  useEffect(() => {
    if (!selectedDocId && dokumen.length > 0 && nomor === '') {
      // Prefill with first default document as template
      populateForm(dokumen[0]);
    } else if (nomor === '') {
      // Prefill defaults manually
      const ppk = pejabat.find(p => p.peran === 'PPK')?.id || '';
      const bnd = pejabat.find(p => p.peran === 'Bendahara')?.id || '';
      const rkn = pejabat.find(p => p.peran === 'Rekanan')?.id || '';
      const kds = pejabat.find(p => p.peran === 'Kadis')?.id || '';
      const pptk = pejabat.find(p => p.peran === 'PPTK')?.id || '';
      const rek = rekening[0]?.id || '';

      setPpkId(ppk);
      setBendaharaId(bnd);
      setRekananId(rkn);
      setKadisId(kds);
      setPptkId(pptk);
      setRekeningId(rek);
      setNomor('53.16/03.0/000097/LS/1.03.0.00.0.00.01.0000/P2/7/2026');
    }
  }, []);

  // Handle Tax Recalculation on Nilai change
  const handleRecalculateTaxes = () => {
    // Simulated tax calculation rules for Dinas PUPR consultancies
    // DPP = Nilai / 1.11 (if 11% PPN inclusive)
    const dpp = nilai / 1.11;
    setTaxPPN(Math.round(dpp * 0.11));
    setTaxPPh23(Math.round(dpp * 0.02)); // Consulting service (2%)
    setTaxPPh22(0); // Consultation is usually PPh 23, not PPh 22 (which is 1.5% for goods)
    setTaxPPh21(0);
    setTaxDaerah(Math.round(dpp * 0.015)); // Custom 1.5% regional levy
  };

  const handleCreateNewBlank = () => {
    setSelectedDocId(null);
    setNomor(`53.16/03.0/000098/LS/1.03.0.00.0.00.01.0000/P2/7/2026`);
    setTanggal('2026-07-21');
    setNilai(0);
    setUraian('');
    
    // Clear officials to fill manually
    setPpkId('');
    setBendaharaId('');
    setRekananId('');
    setKadisId('');
    setPptkId('');
    setRekeningId('');

    // Clear manual rekanan
    setManualRekananInstansi('');
    setManualRekananNama('');
    setManualRekananJabatan('Kepala Perwakilan');
    setManualRekananAlamat('');

    // Clear supporting docs so they are blank!
    setSupportingDocs([]);
    
    // Reset taxes to 0
    setTaxPPN(0);
    setTaxPPh21(0);
    setTaxPPh22(0);
    setTaxPPh23(0);
    setTaxDaerah(0);
  };

  const handleSaveDocument = () => {
    const totalPajak = taxPPN + taxPPh21 + taxPPh22 + taxPPh23 + taxDaerah;
    const documentData: Dokumen = {
      id: selectedDocId || `dok-${Date.now()}`,
      jenis: activeDocType,
      nomor,
      tanggal,
      nilai,
      terbilang: terbilang(nilai),
      uraian,
      ppkId,
      bendaharaId,
      rekananId,
      kadisId,
      pptkId,
      rekeningId,
      // Save manual rekanan inputs
      manualRekananInstansi,
      manualRekananNama,
      manualRekananJabatan,
      manualRekananAlamat,
      // Fallback for older database formats
      noKontrak: supportingDocs[0]?.nomor || '',
      tglKontrak: supportingDocs[0]?.tanggal || '',
      noSPMK: supportingDocs[1]?.nomor || '',
      tglSPMK: supportingDocs[1]?.tanggal || '',
      noBAST: supportingDocs[2]?.nomor || '',
      tglBAST: supportingDocs[2]?.tanggal || '',
      supportingDocs, // Dynamic documents list
      nilaiKontrak: nilai,
      pajak: {
        ppn: taxPPN,
        pph21: taxPPh21,
        pph22: taxPPh22,
        pph23: taxPPh23,
        daerah: taxDaerah
      },
      totalPajak
    };

    if (selectedDocId) {
      onUpdateDokumen(documentData);
      setSaveStatus('Dokumen berhasil diperbarui!');
    } else {
      onAddDokumen(documentData);
      setSelectedDocId(documentData.id);
      setSaveStatus('Dokumen baru berhasil disimpan!');
    }

    setTimeout(() => setSaveStatus(''), 4000);
  };

  // Get active linked objects
  const activePPK = pejabat.find(p => p.id === ppkId);
  const activeBendahara = pejabat.find(p => p.id === bendaharaId);
  const activeRekanan = rekananId === 'manual' || rekananId === '' ? (
    manualRekananInstansi || manualRekananNama ? {
      id: 'manual',
      nama: manualRekananNama,
      nip: '-',
      jabatan: manualRekananJabatan,
      peran: 'Rekanan' as const,
      instansi: manualRekananInstansi,
      alamat: manualRekananAlamat
    } : null
  ) : pejabat.find(p => p.id === rekananId);
  const activeKadis = pejabat.find(p => p.id === kadisId);
  const activePPTK = pejabat.find(p => p.id === pptkId);
  const activeRekening = rekening.find(r => r.id === rekeningId);

  const formatNoNPD = (docNo: string) => {
    // Generate NPD number based on Kwitansi details
    return `900/DPUPR-NGK/NPD-${docNo.split('/')[2] || '00097'}/VII/2026`;
  };

  const handlePrint = () => {
    if (window.self !== window.top) {
      setShowPrintHintModal(true);
    }
    try {
      window.print();
    } catch (e) {
      console.warn("window.print failed", e);
    }
  };

  return (
    <>
      <div className="space-y-6">
      
      {/* Tab select and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveDocType('Kwitansi'); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeDocType === 'Kwitansi' 
                ? 'bg-amber-500 text-white shadow-md shadow-amber-100' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Kwitansi Belanja
          </button>
          <button
            onClick={() => { setActiveDocType('BAP'); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeDocType === 'BAP' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. Berita Acara (BAP)
          </button>
          <button
            onClick={() => { setActiveDocType('NPD'); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeDocType === 'NPD' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Nota Pencairan (NPD)
          </button>
          <button
            onClick={() => { setActiveDocType('SPJ'); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeDocType === 'SPJ' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-100' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            4. Berkas SPJ & SPTJM
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNewBlank}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Buat baru"
          >
            <Plus className="w-4 h-4 text-indigo-600" /> Baru
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Cetak Dokumen"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Cetak (PDF)
          </button>
        </div>
      </div>

      {/* Sandbox Print Warning/Tip */}
      {window.self !== window.top && (
        <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-2xl flex items-start gap-2.5 text-slate-750 text-xs no-print shadow-xs">
          <span className="text-amber-500 font-bold shrink-0 text-sm">💡</span>
          <div>
            <p className="font-semibold text-slate-900">Petunjuk Cetak (Iframe Sandbox):</p>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              Karena aplikasi ini berjalan di dalam frame AI Studio, beberapa browser mungkin memblokir fungsi cetak langsung. Jika tombol <strong>Cetak (PDF)</strong> tidak terbuka, silakan klik tombol <strong>"Open in New Tab" (Buka di Tab Baru)</strong> yang berada di pojok kanan atas layar Anda, lalu coba cetak kembali.
            </p>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Interactive Editor (no-print) */}
        <div className="lg:col-span-5 space-y-6 no-print">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" /> Form Data Dokumen
              </h3>
              {saveStatus && (
                <span className="text-emerald-600 text-[11px] font-bold bg-emerald-50 px-2 py-1 rounded-md animate-pulse">
                  {saveStatus}
                </span>
              )}
            </div>

            {/* List of existing documents of this type for easy load */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih dari Arsip Dokumen</label>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {dokumen.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => populateForm(doc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border shrink-0 transition-all cursor-pointer ${
                      selectedDocId === doc.id
                        ? 'bg-slate-900 border-slate-950 text-white'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {doc.nomor.split('/')[2] || doc.nomor.slice(0, 10)} ({formatRupiah(doc.nilai)})
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Form Inputs */}
            <div className="space-y-4">
              
              {/* Logo & Stamp Settings */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Setelan Tampilan Hasil Cetak</span>
                
                {/* Logo Google Drive Share Link */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                    🔗 Link Logo Dinas (Google Drive)
                  </label>
                  <input
                    type="text"
                    value={logoLink}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLogoLink(val);
                      localStorage.setItem('pupr_logo_link', val);
                    }}
                    placeholder="Masukkan share link logo dari Google Drive..."
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 bg-white"
                  />
                  <p className="text-[9px] text-slate-400">
                    Contoh: https://drive.google.com/file/d/1_T0X.../view
                  </p>
                </div>

                {/* Show/Hide Cap Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={showCap}
                    onChange={(e) => setShowCap(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="leading-tight">
                    <span className="text-[11px] font-bold text-slate-700 block">Tampilkan Cap / Stempel Dinas & Rekanan</span>
                    <span className="text-[9px] text-slate-400">Hilangkan tanda centang ini jika tidak perlu ada cap (cap dinonaktifkan secara bawaan)</span>
                  </div>
                </label>
              </div>

              {/* Nomor Dokumen & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Nomor Dokumen</label>
                  <input
                    type="text"
                    required
                    value={nomor}
                    onChange={(e) => setNomor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Tanggal Dokumen</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Nilai Pembayaran & Auto Tax clicker */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nominal Uang (Kotor)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      required
                      value={nilai || ''}
                      onChange={(e) => setNilai(parseInt(e.target.value, 10) || 0)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs font-bold font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRecalculateTaxes}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    title="Kalkulasi Potongan Pajak otomatis dari nominal kotor"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600" /> Pajak Auto
                  </button>
                </div>
              </div>

              {/* Uraian Belanja */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Uraian Pembayaran</label>
                <textarea
                  rows={3}
                  value={uraian}
                  onChange={(e) => setUraian(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs text-slate-700 resize-none leading-relaxed"
                />
              </div>

              {/* Rekening Anggaran Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Rekening Belanja SIPD</label>
                <select
                  value={rekeningId}
                  onChange={(e) => setRekeningId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs text-slate-700 bg-white"
                >
                  <option value="">-- Pilih Kode Rekening --</option>
                  {rekening.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.kode}] {r.uraian}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pejabat Selectors Dropdowns */}
              <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Otoritas Penandatangan</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* PPK */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">PPK Jalan (Pihak Kesatu)</label>
                    <select
                      value={ppkId}
                      onChange={(e) => setPpkId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-[11px] bg-white text-slate-700"
                    >
                      <option value="">-- Pilih PPK --</option>
                      {pejabat.filter(p => p.peran === 'PPK' || p.peran === 'Lainnya').map(p => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bendahara */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Bendahara Pengeluaran</label>
                    <select
                      value={bendaharaId}
                      onChange={(e) => setBendaharaId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-[11px] bg-white text-slate-700"
                    >
                      <option value="">-- Pilih Bendahara --</option>
                      {pejabat.filter(p => p.peran === 'Bendahara' || p.peran === 'Lainnya').map(p => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rekanan */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Yang Menerima (Pihak Kedua)</label>
                    <select
                      value={rekananId}
                      onChange={(e) => setRekananId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-[11px] bg-white text-slate-700"
                    >
                      <option value="">-- Pilih Rekanan (atau Ketik Manual di bawah) --</option>
                      {pejabat.filter(p => p.peran === 'Rekanan' || p.peran === 'Lainnya').map(p => (
                        <option key={p.id} value={p.id}>{p.nama} ({p.instansi})</option>
                      ))}
                      <option value="manual">✏️ Ketik Manual (Input Baru) ...</option>
                    </select>
                  </div>

                  {/* Manual Rekanan Fields */}
                  {(rekananId === 'manual' || rekananId === '') && (
                    <div className="sm:col-span-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <div className="sm:col-span-2 text-[10px] font-bold text-indigo-700 uppercase tracking-wide flex items-center justify-between">
                        <span>Ketik Manual Data Rekanan (Pihak Kedua)</span>
                        <span className="text-[8px] font-normal text-slate-400 font-sans normal-case">Tipe ini akan langsung diperbarui di berkas cetak</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Nama Instansi / CV / PT</label>
                        <input
                          type="text"
                          placeholder="Contoh: CV. EL EMUNAH"
                          value={manualRekananInstansi}
                          onChange={(e) => setManualRekananInstansi(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-[11px] bg-white text-slate-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Nama Penanggung Jawab</label>
                        <input
                          type="text"
                          placeholder="Contoh: YOHANES SAPA, ST"
                          value={manualRekananNama}
                          onChange={(e) => setManualRekananNama(e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-[11px] bg-white text-slate-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Jabatan Pihak Kedua</label>
                        <input
                          type="text"
                          placeholder="Contoh: Kepala Perwakilan / Direktur"
                          value={manualRekananJabatan}
                          onChange={(e) => setManualRekananJabatan(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-[11px] bg-white text-slate-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Alamat Kantor</label>
                        <input
                          type="text"
                          placeholder="Contoh: Jln. Jend. Sudirman No. 4, Mbay"
                          value={manualRekananAlamat}
                          onChange={(e) => setManualRekananAlamat(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-[11px] bg-white text-slate-700"
                        />
                      </div>
                    </div>
                  )}

                  {/* Kepala Dinas */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Kepala Dinas (PA)</label>
                    <select
                      value={kadisId}
                      onChange={(e) => setKadisId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-[11px] bg-white text-slate-700"
                    >
                      <option value="">-- Pilih Kepala Dinas --</option>
                      {pejabat.filter(p => p.peran === 'Kadis' || p.peran === 'Lainnya').map(p => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>

                  {/* PPTK */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">PPTK Sub-Kegiatan</label>
                    <select
                      value={pptkId}
                      onChange={(e) => setPptkId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 text-[11px] bg-white text-slate-700"
                    >
                      <option value="">-- Pilih PPTK --</option>
                      {pejabat.filter(p => p.peran === 'PPTK' || p.peran === 'Lainnya').map(p => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic References Details */}
              <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dokumen Pendukung / Lampiran</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSupportingDocs([
                        ...supportingDocs,
                        { id: `doc-ref-${Date.now()}-${Math.random()}`, label: 'DOKUMEN BARU', nomor: '', tanggal: '' }
                      ]);
                    }}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Tambah Dokumen
                  </button>
                </div>
                
                {supportingDocs.length > 0 ? (
                  <div className="space-y-3">
                    {supportingDocs.map((doc, index) => (
                      <div key={doc.id || index} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 relative group shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSupportingDocs(supportingDocs.filter((_, i) => i !== index));
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Jenis / Nama Dokumen</label>
                            <input
                              type="text"
                              value={doc.label}
                              onChange={(e) => {
                                const updated = [...supportingDocs];
                                updated[index].label = e.target.value;
                                setSupportingDocs(updated);
                              }}
                              placeholder="Contoh: KONTRAK, SPMK, BAST, dll"
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 font-bold bg-white text-slate-700"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Nomor Dokumen</label>
                              <input
                                type="text"
                                value={doc.nomor}
                                onChange={(e) => {
                                  const updated = [...supportingDocs];
                                  updated[index].nomor = e.target.value;
                                  setSupportingDocs(updated);
                                }}
                                placeholder="Nomor surat/kontrak..."
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 font-mono bg-white text-slate-700"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Tanggal Dokumen</label>
                              <input
                                type="date"
                                value={doc.tanggal}
                                onChange={(e) => {
                                  const updated = [...supportingDocs];
                                  updated[index].tanggal = e.target.value;
                                  setSupportingDocs(updated);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 font-mono bg-white text-slate-700"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl bg-white">
                    <p className="text-[11px] text-slate-400">Belum ada dokumen pendukung / lampiran.</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Silakan tambahkan menggunakan tombol di atas.</p>
                  </div>
                )}
              </div>

              {/* Tax Details Modifiers */}
              <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Setoran Pajak Belanja (Kwitansi / BAP)</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">PPN 11%</label>
                    <input
                      type="number"
                      value={taxPPN || ''}
                      onChange={(e) => setTaxPPN(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">PPh 23 (2%)</label>
                    <input
                      type="number"
                      value={taxPPh23 || ''}
                      onChange={(e) => setTaxPPh23(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">PPh 22 (1.5%)</label>
                    <input
                      type="number"
                      value={taxPPh22 || ''}
                      onChange={(e) => setTaxPPh22(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Pajak Daerah</label>
                    <input
                      type="number"
                      value={taxDaerah || ''}
                      onChange={(e) => setTaxDaerah(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveDocument}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Simpan Dokumen Ke Arsip
              </button>

            </div>
          </div>
        </div>

        {/* Right Side: Pixel-Perfect Preview (Full/Print Size) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden print-card p-6 sm:p-10 text-black">
          
          <div className="no-print border-b border-dashed border-slate-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase">
              <Sparkles className="w-4 h-4 text-amber-500" /> Pratinjau Siap Cetak
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Orientasi:</span>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Portrait
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="inline-block rotate-90"><FileText className="w-3.5 h-3.5" /></span> Landscape
              </button>
            </div>
          </div>

          {/* Dynamic Print Orientation Overrides */}
          {orientation === 'landscape' && (
            <style>{`
              @media print {
                @page {
                  size: landscape !important;
                  margin: 1cm !important;
                }
                .print-card {
                  width: 100% !important;
                  max-width: 100% !important;
                }
              }
            `}</style>
          )}

          {/* RENDER SHEET START */}
          <div className="font-sans leading-relaxed tracking-normal max-w-full print:mx-0 select-text">
            
            {/* 1. Official Kop Surat (Header) */}
            <div className="text-center border-b-[3px] border-black pb-3 mb-6 relative pl-16 min-h-[50px]">
              {/* Shield Ornament / Google Drive Image */}
              {logoLink ? (
                <img
                  src={getGoogleDriveImageUrl(logoLink)}
                  alt="Logo Dinas"
                  className="absolute left-2 top-0 w-12 h-12 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="absolute left-2 top-0 w-12 h-12 border border-slate-300 rounded-md flex items-center justify-center text-[7px] font-extrabold text-slate-400 font-mono bg-slate-50 uppercase tracking-widest leading-none no-print">
                  KOP LOGO
                </div>
              )}
              
              <h4 className="text-xs font-bold tracking-wider uppercase leading-tight font-sans">Pemerintah Kabupaten Nagekeo</h4>
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide leading-tight font-sans mt-0.5">Dinas Pekerjaan Umum dan Penataan Ruang</h2>
              <p className="text-[10px] sm:text-xs text-slate-700 italic font-sans leading-snug">Kompleks Bendung Sutami - Mbay, Flores, Nusa Tenggara Timur</p>
            </div>

            {/* Render KWITANSI */}
            {activeDocType === 'Kwitansi' && (
              <div className="space-y-6">
                {/* Title */}
                <div className="text-center space-y-1">
                  <h1 className="text-base sm:text-lg font-bold uppercase tracking-widest border-b border-black inline-block px-4 pb-0.5">Kwitansi</h1>
                  <p className="text-xs font-mono font-bold text-slate-800">NOMOR : {nomor}</p>
                </div>

                {/* Main receipt tables */}
                <div className="space-y-4 text-xs font-sans">
                  
                  {/* Sudah terima dari */}
                  <div className="grid grid-cols-12 gap-1 items-start py-1.5 border-b border-slate-100">
                    <span className="col-span-3 font-semibold text-slate-700">Sudah terima dari</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <span className="col-span-8 font-bold text-slate-900 leading-snug">
                      {activeBendahara ? activeBendahara.jabatan : 'Bendahara Pengeluaran Dinas PUPR Kabupaten Nagekeo'}
                    </span>
                  </div>

                  {/* Banyaknya Uang */}
                  <div className="grid grid-cols-12 gap-1 items-center py-1.5 border-b border-slate-100">
                    <span className="col-span-3 font-semibold text-slate-700">Banyaknya Uang</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <div className="col-span-8 flex items-center gap-2">
                      <span className="font-mono font-extrabold text-slate-900 text-sm sm:text-base bg-amber-50/50 px-3 py-1 rounded-lg border border-amber-200">
                        {formatRupiah(nilai)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">✓ LUNAS</span>
                    </div>
                  </div>

                  {/* Terbilang */}
                  <div className="grid grid-cols-12 gap-1 items-start py-2 border-b border-slate-100">
                    <span className="col-span-3 font-semibold text-slate-700">Terbilang</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <div className="col-span-8 font-bold italic text-slate-900 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-800 flex items-start gap-1">
                      <span>(</span>
                      <span>{terbilang(nilai)}</span>
                      <span>)</span>
                      <span className="text-amber-500 font-bold">✓</span>
                    </div>
                  </div>

                  {/* Untuk */}
                  <div className="grid grid-cols-12 gap-1 items-start py-1.5 border-b border-slate-100">
                    <span className="col-span-3 font-semibold text-slate-700">Untuk</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <span className="col-span-8 text-slate-900 leading-relaxed font-medium">
                      {uraian}
                    </span>
                  </div>

                  {/* Sesuai Dokumen reference */}
                  <div className="space-y-2 py-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50 text-[11px]">
                    <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">Dokumen Pendukung / Sesuai :</span>
                    
                    <div className="space-y-1.5">
                      {supportingDocs.length > 0 ? (
                        supportingDocs.map((doc, idx) => (
                          <div key={doc.id || idx} className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 font-semibold text-slate-600 uppercase">★ {doc.label}</span>
                            <span className="col-span-8 font-mono font-medium">
                              Nomor : {doc.nomor || '-'} {doc.tanggal ? ` / Tanggal : ${formatTanggalIndo(doc.tanggal)}` : ''}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-[10px]">(Tidak ada dokumen pendukung yang diinput)</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* SIGNATURE BLOCKS - EXACT MATCH TO IMAGE 1 */}
                <div className="mt-8 space-y-8 font-sans">
                  
                  {/* Top Signatures: PPK & Bendahara */}
                  <div className="grid grid-cols-2 gap-4 text-center text-[11px] leading-relaxed">
                    <div className="space-y-12">
                      <div>
                        <p className="font-bold uppercase tracking-wider text-slate-700">Setuju dibayar</p>
                        <p className="font-bold text-slate-800">Pejabat Pembuat Komitmen (PPK)</p>
                      </div>
                      {/* Signature line PPK */}
                      {activePPK ? (
                        <div className="relative inline-block px-6">
                          {/* Simulated Signature */}
                          <div className="font-serif italic text-blue-800 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-80 font-bold tracking-widest rotate-[-5deg]">
                            {activePPK.nama.split(',')[0].slice(0, 10)}
                          </div>
                          <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                            {activePPK.nama}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">NIP. {activePPK.nip}</p>
                        </div>
                      ) : (
                        <div className="relative inline-block px-6 pt-8">
                          <div className="w-48 border-t border-black/40 mx-auto"></div>
                          <p className="text-[9px] text-slate-400 italic mt-1">(Nama & NIP PPK Belum Dipilih)</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-12">
                      <div>
                        <p className="font-bold uppercase tracking-wider text-slate-700">Lunas dibayar</p>
                        <p className="font-bold text-slate-800">BENDAHARA PENGELUARAN</p>
                      </div>
                      {/* Signature line Bendahara */}
                      {activeBendahara ? (
                        <div className="relative inline-block px-6">
                          <div className="font-serif italic text-blue-800 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-80 font-bold tracking-widest rotate-[3deg]">
                            {activeBendahara.nama.slice(0, 8)}
                          </div>
                          <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                            {activeBendahara.nama}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">NIP. {activeBendahara.nip}</p>
                        </div>
                      ) : (
                        <div className="relative inline-block px-6 pt-8">
                          <div className="w-48 border-t border-black/40 mx-auto"></div>
                          <p className="text-[9px] text-slate-400 italic mt-1">(Nama & NIP Bendahara Belum Dipilih)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Signatures: Date and Vendor with simulated Meterai */}
                  <div className="flex justify-end text-[11px]">
                    <div className="w-1/2 text-center space-y-12">
                      <div>
                        <p className="text-slate-700">Mbay, {formatTanggalIndo(tanggal)}</p>
                        <p className="font-bold text-slate-800">Yang Menerima</p>
                        <p className="font-bold text-slate-900">{activeRekanan && activeRekanan.instansi ? activeRekanan.instansi : ''}</p>
                      </div>

                      {/* Signature Block with Simulated Meterai stamp! */}
                      {activeRekanan && activeRekanan.nama ? (
                        <div className="relative inline-block px-6">
                          {/* Stamp Overlay */}
                          {showCap && (
                            <div className="absolute -top-16 -left-14 w-28 h-28 border-[3px] border-dashed border-indigo-700/60 rounded-full flex flex-col items-center justify-center text-[7px] text-indigo-700/80 font-bold select-none pointer-events-none rotate-12 scale-90 leading-tight">
                              <span>{activeRekanan.instansi}</span>
                              <span className="text-[5px] border-t border-indigo-700/30 pt-0.5 mt-0.5">MBAY - FLORES</span>
                            </div>
                          )}

                          {/* METERAI 10000 STAMP */}
                          {showCap && (
                            <div className="absolute -top-8 -left-4 w-12 h-16 bg-amber-400/25 border border-amber-500/50 rounded-xs flex flex-col items-center justify-between p-1 select-none pointer-events-none rotate-[-6deg] text-amber-900/80">
                              <span className="text-[4px] font-mono leading-none tracking-tight">8CBE8ANX414</span>
                              <div className="text-center">
                                <span className="text-[5px] font-extrabold leading-none block">METERAI</span>
                                <span className="text-[5px] font-extrabold leading-none block">TEMPEL</span>
                              </div>
                              <span className="text-[7px] font-mono font-bold leading-none">10000</span>
                            </div>
                          )}

                          {/* Signature string */}
                          <div className="font-serif italic text-blue-900 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-95 font-bold tracking-widest rotate-[4deg]">
                            {activeRekanan.nama.split(',')[0]}
                          </div>

                          <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                            {activeRekanan.nama}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold">{activeRekanan.jabatan || 'Kepala Perwakilan'}</p>
                        </div>
                      ) : (
                        <div className="relative inline-block px-6 pt-8">
                          <div className="w-48 border-t border-black/40 mx-auto"></div>
                          <p className="text-[9px] text-slate-400 italic mt-1">(Nama & Instansi Rekanan Belum Diisi)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Center: Mengetahui / Kadis */}
                  <div className="text-center text-[11px] space-y-12 pt-4 border-t border-slate-100">
                    <div className="space-y-0.5">
                      <p className="font-bold uppercase text-slate-700 flex justify-center items-center gap-1">
                        Mengetahui
                      </p>
                      <p className="font-bold text-slate-800">Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo</p>
                      <p className="text-slate-600 font-medium">Pengguna Anggaran</p>
                    </div>

                    {activeKadis ? (
                      <div className="relative inline-block px-6">
                        {/* Circular Dinas Stamp */}
                        {showCap && (
                          <div className="absolute -top-16 -left-12 w-28 h-28 border-[4px] border-double border-indigo-700/65 rounded-full flex flex-col items-center justify-center text-[8px] text-indigo-700/80 font-bold select-none pointer-events-none rotate-[-8deg] scale-95 leading-tight">
                            <span>DINAS PEKERJAAN UMUM</span>
                            <span className="text-[6px] tracking-wider my-0.5">KABUPATEN NAGEKEO</span>
                            <span className="text-[7px] font-serif uppercase border-t border-indigo-700/30 pt-0.5">MENGETAHUI</span>
                          </div>
                        )}

                        <div className="font-serif italic text-blue-800 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-85 font-bold tracking-widest rotate-[-3deg]">
                          {activeKadis.nama.split(',')[0]}
                        </div>

                        <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                          {activeKadis.nama}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium leading-none">Pembina Utama Muda, IV/c</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP. {activeKadis.nip}</p>
                      </div>
                    ) : (
                      <div className="relative inline-block px-6 pt-8">
                        <div className="w-48 border-t border-black/40 mx-auto"></div>
                        <p className="text-[9px] text-slate-400 italic mt-1">(Nama & NIP Kadis Belum Dipilih)</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Footnote matching image 1 bottom left */}
                <div className="text-[9px] text-slate-500 border-t border-dashed border-slate-200 pt-3 flex flex-wrap gap-x-6 gap-y-1">
                  <span className="font-bold">Lembar Asli:</span> Untuk Pengguna Anggaran / PPK-SKPD
                  <span>•</span> <span className="font-bold">Salinan 1:</span> Untuk Kuasa BUD
                  <span>•</span> <span className="font-bold">Salinan 2:</span> Untuk Bendahara Pengeluaran / PPTK
                  <span>•</span> <span className="font-bold">Salinan 3:</span> Untuk Arsip Bendahara Pengeluaran / PPTK
                </div>

              </div>
            )}

            {/* Render BERITA ACARA PEMBAYARAN (BAP) */}
            {activeDocType === 'BAP' && (
              <div className="space-y-6">
                {/* Title */}
                <div className="text-center space-y-1">
                  <h1 className="text-base sm:text-lg font-bold uppercase tracking-widest border-b border-black inline-block px-4 pb-0.5">Berita Acara Pembayaran</h1>
                  <p className="text-xs font-mono font-bold text-slate-800">NOMOR : {nomor}</p>
                </div>

                <p className="text-[11px] text-slate-800 text-justify leading-relaxed">
                  Pada Hari ini Rabu Tanggal Lima Belas Bulan Juli Tahun Dua Ribu Dua Puluh Enam, kami yang bertanda tangan di bawah ini :
                </p>

                {/* Parties details - matching image 2 */}
                <div className="space-y-4 text-[11px] font-sans">
                  
                  {/* Pihak Kesatu */}
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">I. PIHAK KESATU (Instansi)</span>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-2 text-slate-600 font-medium">Nama</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-9 font-bold text-slate-900">{activePPK ? activePPK.nama : 'FRANSISKUS P.G DADJO, ST, MT'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-2 text-slate-600 font-medium">NIP</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-9 font-mono text-slate-800">{activePPK ? activePPK.nip : '19780325 201001 1 015'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-2 text-slate-600 font-medium">Jabatan</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-9 text-slate-800 leading-snug">{activePPK ? activePPK.jabatan : 'Pejabat Pembuat Komitmen (PPK)'}</span>
                    </div>
                  </div>

                  {/* Pihak Kedua */}
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">II. PIHAK KEDUA (Rekanan)</span>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-2 text-slate-600 font-medium">Nama</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-9 font-bold text-slate-900">{activeRekanan && activeRekanan.nama ? activeRekanan.nama : ''}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-2 text-slate-600 font-medium">Alamat</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-9 text-slate-800">{activeRekanan && activeRekanan.alamat ? activeRekanan.alamat : ''}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-2 text-slate-600 font-medium">Jabatan</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-9 text-slate-800 font-semibold">{activeRekanan && activeRekanan.jabatan ? activeRekanan.jabatan : 'Kepala Perwakilan'} {activeRekanan && activeRekanan.instansi ? activeRekanan.instansi : ''}</span>
                    </div>
                  </div>

                  {/* Berdasarkan references */}
                  <div className="space-y-1.5 text-[10px] leading-relaxed">
                    <p className="font-bold text-slate-800 uppercase tracking-wider">Berdasarkan :</p>
                    {supportingDocs.map((doc, idx) => (
                      <p key={doc.id || idx} className="pl-3">
                        <strong>{idx + 1}. {doc.label.toUpperCase()}</strong> - Nomor : {doc.nomor || '-'}, {doc.tanggal ? `Tanggal : ${formatTanggalIndo(doc.tanggal)}` : ''}
                        {idx === 0 && (
                          <>
                            , <strong className="font-bold">NILAI KONTRAK Rp : {formatRupiah(nilai)}</strong>, Uraian Pekerjaan : {uraian}
                          </>
                        )}
                      </p>
                    ))}
                    {supportingDocs.length === 0 && (
                      <p className="pl-3 text-slate-400 italic">(Tidak ada dokumen referensi/pendukung)</p>
                    )}
                  </div>

                  {/* Calculations - matching image 2 III */}
                  <div className="space-y-2 pt-3 border-t border-slate-200">
                    <span className="font-bold text-slate-900 block">III. Sesuai Syarat-Syarat Khusus Kontrak, maka PIHAK KEDUA Berhak MENERIMA Pembayaran 100%, dengan rincian sebagai berikut:</span>
                    
                    <div className="border border-slate-300 rounded-xl overflow-hidden font-mono text-[10px] sm:text-[11px]">
                      <div className="bg-slate-50 font-bold p-2.5 border-b border-slate-300 flex justify-between">
                        <span>Deskripsi Rincian Pembayaran</span>
                        <span>Jumlah Payout</span>
                      </div>
                      <div className="p-2.5 space-y-2">
                        <div className="flex justify-between">
                          <span>Pembayaran 100% (Jumlah BAP Fisik ini)</span>
                          <span className="font-bold">{formatRupiah(nilai)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>a. Potongan-potongan Pajak (PPN & PPh)</span>
                          <span>-{formatRupiah(taxPPN + taxPPh23 + taxPPh22 + taxDaerah)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                          <span>Pembayaran BAP Bersih</span>
                          <span>{formatRupiah(nilai - (taxPPN + taxPPh23 + taxPPh22 + taxDaerah))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="italic text-slate-800 font-semibold p-2.5 bg-slate-50 rounded-xl text-xs flex items-start gap-1">
                      <span>Terbilang:</span>
                      <span>({terbilang(nilai)})</span>
                    </div>
                  </div>

                </div>

                 {/* SIGNATURE BLOCKS - IMAGE 2 */}
                 <div className="grid grid-cols-2 gap-4 text-center text-[11px] leading-relaxed pt-8">
                   <div className="space-y-12">
                     <div>
                       <p className="font-bold text-slate-800">PIHAK KEDUA</p>
                       <p className="font-bold text-slate-900">{activeRekanan && activeRekanan.instansi ? activeRekanan.instansi : ''}</p>
                     </div>
                     {activeRekanan && activeRekanan.nama ? (
                       <div className="relative inline-block px-6">
                         <div className="font-serif italic text-blue-900 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-90 font-bold tracking-widest rotate-[4deg]">
                           {activeRekanan.nama.split(',')[0]}
                         </div>
                         <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                           {activeRekanan.nama}
                         </p>
                         <p className="text-[10px] text-slate-500 font-bold">{activeRekanan.jabatan || 'Kepala Perwakilan'}</p>
                       </div>
                     ) : (
                       <div className="relative inline-block px-6 pt-8">
                         <div className="w-48 border-t border-black/40 mx-auto"></div>
                         <p className="text-[9px] text-slate-400 italic mt-1">(Nama & Instansi Rekanan Belum Diisi)</p>
                       </div>
                     )}
                   </div>
 
                   <div className="space-y-12">
                     <div>
                       <p className="font-bold text-slate-800">PIHAK KESATU</p>
                       <p className="text-slate-600 font-medium">Pejabat Pembuat Komitmen (PPK) Program</p>
                       <p className="text-slate-600 font-medium">Penyelenggaraan Jalan T.A. 2026</p>
                     </div>
                     {activePPK ? (
                       <div className="relative inline-block px-6">
                         <div className="font-serif italic text-blue-800 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-85 font-bold tracking-widest rotate-[-5deg]">
                           {activePPK.nama.split(',')[0].slice(0, 10)}
                         </div>
                         <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                           {activePPK.nama}
                         </p>
                         <p className="text-[10px] text-slate-500 font-mono">NIP. {activePPK.nip}</p>
                       </div>
                     ) : (
                       <div className="relative inline-block px-6 pt-8">
                         <div className="w-48 border-t border-black/40 mx-auto"></div>
                         <p className="text-[9px] text-slate-400 italic mt-1">(Nama & NIP PPK Belum Dipilih)</p>
                       </div>
                     )}
                   </div>
                 </div>
 
                 {/* Mengetahui block */}
                 <div className="text-center text-[11px] space-y-12 pt-8 border-t border-slate-100">
                   <div className="space-y-0.5">
                     <p className="font-bold uppercase text-slate-700">Mengetahui</p>
                     <p className="font-bold text-slate-800">Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo</p>
                     <p className="text-slate-600 font-medium">Pengguna Anggaran</p>
                   </div>
 
                   {activeKadis ? (
                     <div className="relative inline-block px-6">
                       <div className="font-serif italic text-blue-800 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-85 font-bold tracking-widest rotate-[-3deg]">
                         {activeKadis.nama.split(',')[0]}
                       </div>
 
                       <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                         {activeKadis.nama}
                       </p>
                       <p className="text-[10px] text-slate-600 font-medium leading-none">Pembina Utama Muda, IV/c</p>
                       <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP. {activeKadis.nip}</p>
                     </div>
                   ) : (
                     <div className="relative inline-block px-6 pt-8">
                       <div className="w-48 border-t border-black/40 mx-auto"></div>
                       <p className="text-[9px] text-slate-400 italic mt-1">(Nama & NIP Kadis Belum Dipilih)</p>
                     </div>
                   )}
                 </div>

              </div>
            )}

            {/* Render NOTA PENCAIRAN DANA (NPD) */}
            {activeDocType === 'NPD' && (
              <div className="space-y-6">
                {/* Title */}
                <div className="text-center space-y-1">
                  <h1 className="text-base sm:text-lg font-bold uppercase tracking-widest border-b border-black inline-block px-4 pb-0.5">Nota Pencairan Dana (NPD)</h1>
                  <p className="text-xs font-mono font-bold text-slate-800">NOMOR : {formatNoNPD(nomor)}</p>
                  <p className="text-xs font-mono font-medium text-slate-500">Tanggal: {formatTanggalIndo(tanggal)}</p>
                </div>

                {/* NPD details table */}
                <div className="space-y-3.5 text-[11px] font-sans">
                  
                  {/* PPTK Details */}
                  <div className="grid grid-cols-12 gap-1 items-start py-1.5 border-b border-slate-100">
                    <span className="col-span-3 font-semibold text-slate-700">Nama PPTK</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <span className="col-span-8 font-bold text-slate-900">
                      {activePPTK ? activePPTK.nama : 'ANSELMUS MERE, SE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-1 items-start py-1.5 border-b border-slate-100">
                    <span className="col-span-3 font-semibold text-slate-700">Program / Kegiatan</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <span className="col-span-8 font-medium text-slate-800 leading-snug">
                      Program Penyelenggaraan Jalan Kabupaten/Kota - Kegiatan Pembangunan Jalan T.A. 2026
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-1 items-start py-1.5 border-b border-slate-100">
                    <span className="col-span-3 font-semibold text-slate-700">Sub-Kegiatan</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <span className="col-span-8 font-mono text-slate-800 font-bold">
                      {activeRekening ? activeRekening.kode.split('.').slice(0, 6).join('.') : '1.03.10.2.01.0053'}
                    </span>
                  </div>

                  {/* Budget accounts columns table - matching image 3 NPD */}
                  <div className="pt-3">
                    <span className="font-bold text-slate-900 block mb-2">Rincian Belanja Sub Kegiatan :</span>
                    
                    <div className="border border-slate-300 rounded-xl overflow-hidden font-mono text-[10px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 font-bold">
                            <th className="p-2 border-r border-slate-300">Kode Rek Sub Rincian Obyek Belanja</th>
                            <th className="p-2 border-r border-slate-300">Uraian</th>
                            <th className="p-2 border-r border-slate-300 text-right">Anggaran (DPA)</th>
                            <th className="p-2 text-right">Pencairan Saat Ini</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="p-2 border-r border-slate-300 break-all">{activeRekening ? activeRekening.kode : '1.03.10.2.01.0053.5.2.04.01.001.0003'}</td>
                            <td className="p-2 border-r border-slate-300 font-sans font-medium">{activeRekening ? activeRekening.uraian : 'Belanja Modal Jalan Kabupaten'}</td>
                            <td className="p-2 border-r border-slate-300 text-right">{formatRupiah(activeRekening ? activeRekening.pagu : 3980000000)}</td>
                            <td className="p-2 text-right font-bold text-indigo-700">{formatRupiah(nilai)}</td>
                          </tr>
                          <tr className="bg-slate-50 font-bold border-t border-slate-300 text-[11px]">
                            <td colSpan={2} className="p-2.5 border-r border-slate-300 text-right">JUMLAH (Rp) :</td>
                            <td className="p-2.5 border-r border-slate-300 text-right">{formatRupiah(activeRekening ? activeRekening.pagu : 3980000000)}</td>
                            <td className="p-2.5 text-right text-indigo-800 font-extrabold">{formatRupiah(nilai)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 leading-normal italic bg-amber-50 p-3 rounded-lg border border-amber-100/50 mt-4">
                    Dengan ini kami menyatakan siap bertanggung jawab dan bersedia melakukan penyetoran kembali terhadap pencairan belanja daerah yang melampaui beban anggaran pada Dokumen Pelaksanaan Anggaran Perangkat Daerah kami.
                  </p>

                </div>

                {/* SIGNATURE BLOCKS - IMAGE 3 */}
                <div className="grid grid-cols-2 gap-4 text-center text-[11px] leading-relaxed pt-8">
                  <div className="space-y-12">
                    <div className="space-y-0.5">
                      <p className="font-bold uppercase text-slate-700">Disiapkan Oleh,</p>
                      <p className="font-bold text-slate-800">PEJABAT PELAKSANA TEKNIS KEGIATAN</p>
                      <p className="text-slate-600 font-medium">PPTK</p>
                    </div>
                    {activePPTK ? (
                      <div className="relative inline-block px-6">
                        <div className="font-serif italic text-blue-800 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-85 font-bold tracking-widest rotate-[3deg]">
                          {activePPTK.nama.split(',')[0]}
                        </div>
                        <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                          {activePPTK.nama}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">NIP. {activePPTK.nip}</p>
                      </div>
                    ) : (
                      <div className="relative inline-block px-6 pt-8">
                        <div className="w-48 border-t border-black/40 mx-auto"></div>
                        <p className="text-[9px] text-slate-400 italic mt-1">(Nama & NIP PPTK Belum Dipilih)</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-12">
                    <div className="space-y-0.5">
                      <p className="font-bold uppercase text-slate-700">Disetujui Oleh,</p>
                      <p className="font-bold text-slate-800 font-sans">Kadis PUPR Kab. Nagekeo</p>
                      <p className="text-slate-600 font-medium">Pengguna Anggaran</p>
                    </div>
                    {activeKadis ? (
                      <div className="relative inline-block px-6">
                        <div className="font-serif italic text-blue-800 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-85 font-bold tracking-widest rotate-[-3deg]">
                          {activeKadis.nama.split(',')[0]}
                        </div>
                        <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                          {activeKadis.nama}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">NIP. {activeKadis.nip}</p>
                      </div>
                    ) : (
                      <div className="relative inline-block px-6 pt-8">
                        <div className="w-48 border-t border-black/40 mx-auto"></div>
                        <p className="text-[9px] text-slate-400 italic mt-1">(Nama & NIP Kadis Belum Dipilih)</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Render SURAT PERTANGGUNGJAWABAN (SPJ) / SPTJM */}
            {activeDocType === 'SPJ' && (
              <div className="space-y-6">
                {/* Title */}
                <div className="text-center space-y-1">
                  <h1 className="text-base sm:text-lg font-bold uppercase tracking-widest border-b border-black inline-block px-4 pb-0.5">Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)</h1>
                  <p className="text-xs font-mono font-bold text-slate-800">Nomor Registrasi SPJ: SPJ/PUPR/{nomor.split('/')[2] || '00097'}/2026</p>
                  <p className="text-xs font-mono font-medium text-slate-500">Tanggal Pengajuan: {formatTanggalIndo(tanggal)}</p>
                </div>

                <div className="space-y-4 text-xs font-sans text-justify leading-relaxed">
                  <p>Saya yang bertanda tangan di bawah ini:</p>
                  
                  <div className="pl-6 space-y-1.5 font-medium text-slate-900">
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-3 text-slate-600">Nama Lengkap</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-8 font-bold">{activeKadis ? activeKadis.nama : 'SYARIFUDIN IBRAHIM, ST'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-3 text-slate-600">NIP</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-8 font-mono">{activeKadis ? activeKadis.nip : '19681102 199703 1 008'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-3 text-slate-600">Jabatan</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-8 text-slate-800">Pengguna Anggaran / Kepala Dinas Pekerjaan Umum dan Penataan Ruang</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-3 text-slate-600">Instansi</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-8 text-slate-800">Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Nagekeo</span>
                    </div>
                  </div>

                  <p>Menyatakan dengan sesungguhnya bahwa:</p>
                  
                  <ol className="list-decimal pl-6 space-y-2.5">
                    <li>
                      Seluruh dokumen pertanggungjawaban belanja dalam Berkas SPJ ini untuk <strong className="font-bold">{uraian}</strong> dengan total nilai pembayaran kotor sebesar <strong className="font-extrabold text-slate-900 font-mono bg-slate-50 px-1 py-0.5 rounded border border-slate-200">{formatRupiah(nilai)} ({terbilang(nilai)})</strong> telah diuji, dihitung, dan diselesaikan sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.
                    </li>
                    <li>
                      Rincian perhitungan pajak atas belanja tersebut sebesar <strong className="font-bold text-slate-900 font-mono">{formatRupiah(taxPPN + taxPPh23 + taxPPh22 + taxDaerah)}</strong> (terdiri dari PPN: {formatRupiah(taxPPN)}, PPh 23: {formatRupiah(taxPPh23)}, PPh 22: {formatRupiah(taxPPh22)}, Pajak Daerah: {formatRupiah(taxDaerah)}) adalah sah dan telah dilakukan penyisihan / pemotongan untuk disetor ke Kas Negara & Kas Daerah.
                    </li>
                    <li>
                      Apabila di kemudian hari berdasarkan hasil audit / pemeriksaan aparat fungsional pengawas terdapat kelebihan pembayaran, kesalahan perhitungan, atau tuntutan ganti kerugian, saya bersedia dan bertanggung jawab penuh secara mutlak untuk menyetorkan kembali kerugian tersebut ke Kas Daerah Kabupaten Nagekeo dalam jangka waktu yang telah ditentukan.
                    </li>
                  </ol>

                  <p>Demikian Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) ini dibuat dengan penuh kesadaran dan tanggung jawab untuk dapat dipergunakan sebagaimana mestinya.</p>
                </div>

                {/* SIGNATURE WITH METERAI & SEAL */}
                <div className="flex justify-end pt-4">
                  <div className="w-1/2 text-center space-y-12 text-[11px]">
                    <div className="space-y-0.5">
                      <p className="text-slate-700">Mbay, {formatTanggalIndo(tanggal)}</p>
                      <p className="font-bold text-slate-800 uppercase">Kepala Dinas PUPR / Pengguna Anggaran</p>
                    </div>

                    {activeKadis ? (
                      <div className="relative inline-block px-6">
                        {/* Circle seal of PUPR */}
                        {showCap && (
                          <div className="absolute -top-16 -left-12 w-28 h-28 border-[4px] border-double border-indigo-700/65 rounded-full flex flex-col items-center justify-center text-[8px] text-indigo-700/80 font-bold select-none pointer-events-none rotate-[-8deg] scale-95 leading-tight">
                            <span>DINAS PEKERJAAN UMUM</span>
                            <span className="text-[6px] tracking-wider my-0.5">KABUPATEN NAGEKEO</span>
                            <span className="text-[7px] font-serif uppercase border-t border-indigo-700/30 pt-0.5">MENGETAHUI</span>
                          </div>
                        )}

                        {/* METERAI 10000 STAMP */}
                        {showCap && (
                          <div className="absolute -top-8 -left-4 w-12 h-16 bg-amber-400/25 border border-amber-500/50 rounded-xs flex flex-col items-center justify-between p-1 select-none pointer-events-none rotate-[-6deg] text-amber-900/80">
                            <span className="text-[4px] font-mono leading-none tracking-tight">MTR10000X99</span>
                            <div className="text-center">
                              <span className="text-[5px] font-extrabold leading-none block">METERAI</span>
                              <span className="text-[5px] font-extrabold leading-none block">TEMPEL</span>
                            </div>
                            <span className="text-[7px] font-mono font-bold leading-none">10000</span>
                          </div>
                        )}

                        {/* Signature Name */}
                        <div className="font-serif italic text-blue-800 text-lg absolute -top-8 left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-85 font-bold tracking-widest rotate-[-3deg]">
                          {activeKadis.nama.split(',')[0]}
                        </div>

                        <p className="font-bold underline text-slate-900 border-t border-black/55 pt-1 uppercase">
                          {activeKadis.nama}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium leading-none">Pembina Utama Muda, IV/c</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP. {activeKadis.nip}</p>
                      </div>
                    ) : (
                      <div className="relative inline-block px-6 pt-8">
                        <div className="w-48 border-t border-black/40 mx-auto"></div>
                        <p className="text-[9px] text-slate-400 italic mt-1">(Nama & NIP Kadis Belum Dipilih)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* VERIFICATION CHECKLIST SECTION (INTEGRATED VIEW) */}
                <div className="mt-8 pt-6 border-t-[2px] border-black border-dashed font-sans space-y-4 no-print-break">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase mb-3">
                      <Stamp className="w-4 h-4 text-purple-600" /> Checklist Integrasi Dokumen & Kelengkapan SPJ
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                      <div className="space-y-2">
                        <span className="font-bold text-slate-600 uppercase text-[9px] block tracking-wide">I. Berkas Utama SPJ (Sistem Informasi SIPD)</span>
                        
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <div>
                              <p className="font-semibold text-slate-800">1. Surat Pengantar SPJ (SIPD)</p>
                              <p className="text-[10px] text-slate-500">Nomor Surat Pengantar terhubung ke DPA SKPD Dinas PUPR</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <div>
                              <p className="font-semibold text-slate-800">2. Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)</p>
                              <p className="text-[10px] text-slate-500">Ditandatangani di atas meterai 10000 oleh Pengguna Anggaran</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <div>
                              <p className="font-semibold text-slate-800">3. Nota Pencairan Dana (NPD)</p>
                              <p className="text-[10px] text-slate-500">No: {formatNoNPD(nomor)} • Sebesar {formatRupiah(nilai)}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <div>
                              <p className="font-semibold text-slate-800">4. Kwitansi Belanja Dinas</p>
                              <p className="text-[10px] text-slate-500">No: {nomor} • Ditandatangani PPK, Bendahara, & Penerima</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold text-slate-600 uppercase text-[9px] block tracking-wide">II. Rincian & Lampiran Pendukung SPJ</span>
                        
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <div>
                              <p className="font-semibold text-slate-800">5. Bukti Pemotongan Pajak Belanja</p>
                              <p className="text-[10px] text-slate-500">PPN 11%: {formatRupiah(taxPPN)} | PPh: {formatRupiah(taxPPh23 + taxPPh22 + taxPPh21)} | Daerah: {formatRupiah(taxDaerah)}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <div>
                              <p className="font-semibold text-slate-800">6. Berita Acara Pembayaran (BAP) Fisik</p>
                              <p className="text-[10px] text-slate-500">Menyatakan penyelesaian fisik pekerjaan konsultansi 100%</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">7. Dokumen Pendukung & Lampiran ({supportingDocs.length} Berkas)</p>
                              <div className="text-[10px] text-slate-500 space-y-0.5 mt-0.5">
                                {supportingDocs.length > 0 ? (
                                  supportingDocs.map((doc, dIdx) => (
                                    <p key={doc.id || dIdx} className="pl-1">
                                      • <strong>{doc.label}</strong>: {doc.nomor || '-'} {doc.tanggal ? `• Tanggal: ${formatTanggalIndo(doc.tanggal)}` : ''}
                                    </p>
                                  ))
                                ) : (
                                  <p className="text-slate-400 italic">Belum ada berkas pendukung yang diinput</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-semibold text-slate-500 font-sans">
                      <span>Status Verifikasi Keuangan Dinas: <span className="text-emerald-600 font-bold">✓ LENGKAP & VALID (SIAP AJUKAN SPM)</span></span>
                      <span className="font-mono text-[9px]">Sistem Informasi SPJ Dinas PUPR Nagekeo 2026</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
          {/* RENDER SHEET END */}

        </div>

      </div>

    </div>

    {/* Modal Hint for Printing Inside Sandbox Iframe */}
    {showPrintHintModal && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Printer className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Petunjuk Pencetakan Dokumen</h3>
              <p className="text-[10px] text-slate-500">Iframe Sandbox Browser Security</p>
            </div>
          </div>

          <div className="space-y-2 text-xs leading-relaxed text-slate-600">
            <p>
              Sistem keamanan modern memblokir dialog cetak otomatis (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">window.print</code>) dari dalam bingkai (iframe) pratinjau aplikasi ini.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
              <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Langkah Mudah Mencetak:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-750">
                <li>
                  Klik tombol <strong>"Open in New Tab" (Buka di Tab Baru)</strong> di pojok kanan atas layar Anda (ikon panah keluar).
                </li>
                <li>
                  Aplikasi akan terbuka penuh di tab baru. Silakan klik tombol <strong>Cetak (PDF)</strong> di sana.
                </li>
                <li>
                  Dialog cetak sistem printer bawaan browser Anda akan langsung terbuka dengan lancar!
                </li>
              </ol>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowPrintHintModal(false);
                try { window.print(); } catch (e) {}
              }}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              Coba Cetak Saja
            </button>
            <button
              type="button"
              onClick={() => setShowPrintHintModal(false)}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              Mengerti, Tutup
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
