import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  Percent, 
  HelpCircle, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  FileText,
  Bookmark,
  TrendingDown,
  Scale
} from 'lucide-react';
import { CatatanPajak, RekeningAnggaran } from '../types';
import { formatRupiah } from '../utils/indonesianHelper';

interface TaxCalculatorProps {
  rekening: RekeningAnggaran[];
  pajak: CatatanPajak[];
  onAddPajakLog: (log: Omit<CatatanPajak, 'id'>) => void;
  onDeletePajakLog: (id: string) => void;
}

export default function TaxCalculator({ 
  rekening, 
  pajak, 
  onAddPajakLog,
  onDeletePajakLog
}: TaxCalculatorProps) {
  // Input states
  const [nominalGross, setNominalGross] = useState<number>(99900000);
  const [taxBasis, setTaxBasis] = useState<'inclusive' | 'exclusive'>('inclusive'); // inclusive: price includes tax, exclusive: tax added on top
  
  // Tax toggles & custom rates
  const [usePPN, setUsePPN] = useState(true);
  const [usePPh22, setUsePPh22] = useState(false);
  const [usePPh23, setUsePPh23] = useState(true);
  const [usePPh21, setUsePPh21] = useState(false);
  const [useDaerah, setUseDaerah] = useState(true);
  
  // Custom custom rates if needed (or standard defaults)
  const PPN_RATE = 0.11; // 11%
  const PPH22_RATE = 0.015; // 1.5%
  const PPH23_RATE = 0.02; // 2.0%
  const PPH21_RATE = 0.05; // 5.0%
  const DAERAH_RATE = 0.015; // 1.5% (contoh pajak daerah Nagekeo)

  // Calculate DPP (Dasar Pengenaan Pajak)
  const dpp = taxBasis === 'inclusive' && usePPN 
    ? nominalGross / (1 + PPN_RATE) 
    : nominalGross;

  // Compute Taxes based on DPP
  const calculatedPPN = usePPN ? dpp * PPN_RATE : 0;
  const calculatedPPh22 = usePPh22 ? dpp * PPH22_RATE : 0;
  const calculatedPPh23 = usePPh23 ? dpp * PPH23_RATE : 0;
  const calculatedPPh21 = usePPh21 ? dpp * PPH21_RATE : 0;
  const calculatedDaerah = useDaerah ? dpp * DAERAH_RATE : 0;

  const totalPotongan = calculatedPPN + calculatedPPh22 + calculatedPPh23 + calculatedPPh21 + calculatedDaerah;
  const netMenerima = nominalGross - totalPotongan;

  // Ledger form states
  const [noBukti, setNoBukti] = useState('');
  const [uraian, setUraian] = useState('');
  const [selectedRekId, setSelectedRekId] = useState('');
  const [pihakMenerima, setPihakMenerima] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveToLedger = (e: FormEvent) => {
    e.preventDefault();
    if (!noBukti || !uraian || !selectedRekId || !pihakMenerima) {
      alert('Mohon lengkapi data buku pembantu pajak!');
      return;
    }

    const linkedRek = rekening.find(r => r.id === selectedRekId);
    const kodeRek = linkedRek ? linkedRek.kode : 'Umum';

    onAddPajakLog({
      noBukti,
      tanggal: new Date().toISOString().split('T')[0],
      kodeRekening: kodeRek,
      uraian,
      ppn: Math.round(calculatedPPN),
      pph21: Math.round(calculatedPPh21),
      pph22: Math.round(calculatedPPh22),
      pph23: Math.round(calculatedPPh23),
      daerah: Math.round(calculatedDaerah),
      total: Math.round(totalPotongan),
      pihakMenerima
    });

    setSuccessMsg('Potongan pajak berhasil dicatat di Buku Pembantu Pajak!');
    setNoBukti('');
    setUraian('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Introduction Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Kalkulator Pajak Belanja Pemerintah</h2>
          <p className="text-xs text-slate-500">Hitung potongan PPN dan PPh secara akurat sesuai peraturan perpajakan instansi pemerintah / SIPD</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold self-start md:self-auto border border-emerald-100">
          <Percent className="w-4 h-4" /> Aturan Perpajakan Indonesia TA 2026
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Calculations & Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-50">
              <Calculator className="w-5 h-5 text-indigo-600" /> Pengaturan Nilai & Parameter Pajak
            </h3>

            {/* Nominal input and basis toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Jumlah Nominal Pembayaran (Kotor)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={nominalGross || ''}
                    onChange={(e) => setNominalGross(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono text-slate-800 placeholder-slate-400 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Dasar Pengenaan Pajak (DPP)</label>
                <div className="grid grid-cols-2 gap-2 h-[42px]">
                  <button
                    type="button"
                    onClick={() => setTaxBasis('inclusive')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      taxBasis === 'inclusive' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Termasuk PPN (Inclusive)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxBasis('exclusive')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      taxBasis === 'exclusive' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Belum PPN (Exclusive)
                  </button>
                </div>
              </div>
            </div>

            {/* Tax checkboxes */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase block">Pilih Jenis Pajak yang Berlaku</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* PPN */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  usePPN ? 'border-blue-200 bg-blue-50/20' : 'border-slate-100 hover:bg-slate-50'
                }`}>
                  <input
                    type="checkbox"
                    id="ppn"
                    checked={usePPN}
                    onChange={(e) => setUsePPN(e.target.checked)}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="ppn" className="text-xs cursor-pointer select-none">
                    <span className="font-bold text-slate-800 block">PPN 11%</span>
                    <span className="text-slate-500">Pajak Pertambahan Nilai atas penyerahan barang/jasa</span>
                  </label>
                </div>

                {/* PPh 23 */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  usePPh23 ? 'border-purple-200 bg-purple-50/20' : 'border-slate-100 hover:bg-slate-50'
                }`}>
                  <input
                    type="checkbox"
                    id="pph23"
                    checked={usePPh23}
                    onChange={(e) => {
                      setUsePPh23(e.target.checked);
                      if (e.target.checked) setUsePPh22(false); // standard consultation service doesn't apply goods PPh 22 simultaneously
                    }}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="pph23" className="text-xs cursor-pointer select-none">
                    <span className="font-bold text-slate-800 block">PPh 23 (2.0%)</span>
                    <span className="text-slate-500">Jasa Konsultansi, Konstruksi & sewa selain tanah/bangunan</span>
                  </label>
                </div>

                {/* PPh 22 */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  usePPh22 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100 hover:bg-slate-50'
                }`}>
                  <input
                    type="checkbox"
                    id="pph22"
                    checked={usePPh22}
                    onChange={(e) => {
                      setUsePPh22(e.target.checked);
                      if (e.target.checked) setUsePPh23(false);
                    }}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="pph22" className="text-xs cursor-pointer select-none">
                    <span className="font-bold text-slate-800 block">PPh 22 (1.5%)</span>
                    <span className="text-slate-500">Belanja modal berupa pembelian/pengadaan barang fisik</span>
                  </label>
                </div>

                {/* PPh 21 */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  usePPh21 ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100 hover:bg-slate-50'
                }`}>
                  <input
                    type="checkbox"
                    id="pph21"
                    checked={usePPh21}
                    onChange={(e) => setUsePPh21(e.target.checked)}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="pph21" className="text-xs cursor-pointer select-none">
                    <span className="font-bold text-slate-800 block">PPh 21 (5.0%)</span>
                    <span className="text-slate-500">Honorarium, narasumber ahli, atau upah perorangan</span>
                  </label>
                </div>

                {/* Pajak Daerah */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  useDaerah ? 'border-pink-200 bg-pink-50/20' : 'border-slate-100 hover:bg-slate-50'
                }`}>
                  <input
                    type="checkbox"
                    id="daerah"
                    checked={useDaerah}
                    onChange={(e) => setUseDaerah(e.target.checked)}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="daerah" className="text-xs cursor-pointer select-none">
                    <span className="font-bold text-slate-800 block">Pajak Daerah (1.5%)</span>
                    <span className="text-slate-500">Retribusi daerah / galian golongan C di Kab. Nagekeo</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown Cards */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Rincian Formula Perhitungan</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500">Dasar Pengenaan Pajak (DPP):</span>
                  {taxBasis === 'inclusive' && usePPN ? (
                    <p className="font-mono font-semibold text-slate-800">
                      DPP = {formatRupiah(nominalGross)} / 1.11 = <strong className="text-indigo-700 font-bold">{formatRupiah(dpp)}</strong>
                    </p>
                  ) : (
                    <p className="font-mono font-semibold text-slate-800">
                      DPP = Nominal Kotor = <strong className="text-indigo-700 font-bold">{formatRupiah(dpp)}</strong>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500">Metode Pemungutan:</span>
                  <p className="font-semibold text-slate-800">
                    {taxBasis === 'inclusive' 
                      ? 'Termasuk PPN (Dihitung mundur dari Gross)' 
                      : 'Pajak Tambahan (Dikalikan langsung dari Pagu)'}
                  </p>
                </div>
              </div>

              {/* Table of breakdown values */}
              <div className="border-t border-slate-150 pt-3 space-y-2 text-xs">
                <div className="flex justify-between font-medium py-1 text-slate-500">
                  <span>Deskripsi Perpajakan</span>
                  <span className="text-right">Potongan Anggaran</span>
                </div>
                
                {usePPN && (
                  <div className="flex justify-between font-mono font-semibold text-slate-800">
                    <span>PPN (11% x DPP)</span>
                    <span className="text-blue-600">-{formatRupiah(calculatedPPN)}</span>
                  </div>
                )}
                {usePPh21 && (
                  <div className="flex justify-between font-mono font-semibold text-slate-800">
                    <span>PPh 21 (5% x DPP)</span>
                    <span className="text-emerald-600">-{formatRupiah(calculatedPPh21)}</span>
                  </div>
                )}
                {usePPh22 && (
                  <div className="flex justify-between font-mono font-semibold text-slate-800">
                    <span>PPh 22 (1.5% x DPP)</span>
                    <span className="text-amber-600">-{formatRupiah(calculatedPPh22)}</span>
                  </div>
                )}
                {usePPh23 && (
                  <div className="flex justify-between font-mono font-semibold text-slate-800">
                    <span>PPh 23 (2% x DPP)</span>
                    <span className="text-purple-600">-{formatRupiah(calculatedPPh23)}</span>
                  </div>
                )}
                {useDaerah && (
                  <div className="flex justify-between font-mono font-semibold text-slate-800">
                    <span>Pajak Daerah (1.5% x DPP)</span>
                    <span className="text-pink-600">-{formatRupiah(calculatedDaerah)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-mono font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
                  <span>Total Potongan Pajak</span>
                  <span className="text-red-600">-{formatRupiah(totalPotongan)}</span>
                </div>

                <div className="flex justify-between font-bold text-emerald-800 text-sm bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/50 mt-2">
                  <span className="flex items-center gap-1"><Scale className="w-4 h-4 shrink-0 text-emerald-600" /> Bersih Diterima Rekanan (Net)</span>
                  <span className="font-mono">{formatRupiah(netMenerima)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Log to Book Ledger Form */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-50">
              Catat di Buku Pembantu Pajak
            </h3>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSaveToLedger} className="space-y-3.5">
              {/* No Bukti BKU */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Bukti Pajak / BKU</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 148/DPUPR-NGK/VI/2026"
                  value={noBukti}
                  onChange={(e) => setNoBukti(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 font-mono"
                />
              </div>

              {/* Rekening Target */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ditautkan ke Rekening Anggaran</label>
                <select
                  required
                  value={selectedRekId}
                  onChange={(e) => setSelectedRekId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 bg-white"
                >
                  <option value="">-- Pilih Rekening Belanja --</option>
                  {rekening.map((rek) => (
                    <option key={rek.id} value={rek.id}>
                      {rek.kode.slice(0, 15)}... - {rek.uraian.slice(0, 25)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Pihak Menerima */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pihak Penerima (Rekanan)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CV. EL EMUNAH / Yohanes Sapa"
                  value={pihakMenerima}
                  onChange={(e) => setPihakMenerima(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 font-semibold"
                />
              </div>

              {/* Uraian */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Uraian Transaksi Pajak</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Keterangan setoran potongan pajak..."
                  value={uraian}
                  onChange={(e) => setUraian(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Catat Potongan Pajak
              </button>
            </form>
          </div>

          {/* Buku Pembantu Pajak Ledger Logs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Histori Buku Pajak</h3>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
              {pajak.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-[11px]">
                  Belum ada catatan pajak belanja.
                </div>
              ) : (
                pajak.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span className="font-mono">{log.noBukti}</span>
                      <span className="text-indigo-600 font-mono">{formatRupiah(log.total)}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-1">{log.uraian}</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Penerima: {log.pihakMenerima}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Hapus log pajak ini?')) {
                            onDeletePajakLog(log.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
