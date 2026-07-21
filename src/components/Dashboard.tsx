import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Wallet, 
  FileCheck, 
  Percent, 
  Receipt, 
  FileText, 
  Calculator, 
  ArrowRight,
  ShieldCheck,
  Building,
  Calendar
} from 'lucide-react';
import { RekeningAnggaran, Dokumen, CatatanPajak } from '../types';
import { formatRupiah } from '../utils/indonesianHelper';

interface DashboardProps {
  rekening: RekeningAnggaran[];
  dokumen: Dokumen[];
  pajak: CatatanPajak[];
  onNavigate: (tab: string) => void;
  onSelectDokumen: (dok: Dokumen) => void;
}

export default function Dashboard({ 
  rekening, 
  dokumen, 
  pajak, 
  onNavigate,
  onSelectDokumen 
}: DashboardProps) {
  
  // Calculate statistics
  const totalPagu = rekening.reduce((sum, item) => sum + item.pagu, 0);
  const totalRealisasi = rekening.reduce((sum, item) => sum + item.realisasi, 0);
  const sisaAnggaran = totalPagu - totalRealisasi;
  const persentaseRealisasi = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

  // Calculate taxes
  const totalPPN = pajak.reduce((sum, item) => sum + item.ppn, 0);
  const totalPPh21 = pajak.reduce((sum, item) => sum + item.pph21, 0);
  const totalPPh22 = pajak.reduce((sum, item) => sum + item.pph22, 0);
  const totalPPh23 = pajak.reduce((sum, item) => sum + item.pph23, 0);
  const totalPajakDaerah = pajak.reduce((sum, item) => sum + item.daerah, 0);
  const totalPajak = totalPPN + totalPPh21 + totalPPh22 + totalPPh23 + totalPajakDaerah;

  // Recent documents
  const recentDokumen = [...dokumen]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" /> Dinas PUPR Kabupaten Nagekeo
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Sistem Administrasi Keuangan & SPJ
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Selamat datang di portal pengelolaan anggaran, penatausahaan pajak belanja, dan pembuatan dokumen Surat Pertanggungjawaban (SPJ) otomatis Dinas Pekerjaan Umum dan Penataan Ruang.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1 shrink-0 bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>TAHUN ANGGARAN</span>
            </div>
            <span className="text-2xl font-mono font-bold text-amber-400">2026</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Pagu - Bento Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[160px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pagu DPA</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatRupiah(totalPagu)}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Alokasi Anggaran</p>
          </div>
        </motion.div>

        {/* Realisasi Belanja - Bento Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[160px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Realisasi</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-emerald-700 font-mono tracking-tight">
              {formatRupiah(totalRealisasi)}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">Belanja SPD Terdaftar</p>
          </div>
        </motion.div>

        {/* Sisa Anggaran - Bento Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[160px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sisa Dana</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatRupiah(sisaAnggaran)}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">Sisa Dana Tersedia</p>
          </div>
        </motion.div>

        {/* Persentase Realisasi - Accent Highlight Bento Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="col-span-1 bg-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-100 flex flex-col justify-between min-h-[160px] text-white"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-indigo-500 text-white">
              <Percent className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Penyerapan</span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-mono">{persentaseRealisasi.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-indigo-700/60 rounded-full h-1.5 mt-2">
              <div 
                className="bg-white h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(persentaseRealisasi, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Alokasi & Realisasi Anggaran per Rekening - Large Bento Card */}
        <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">Daftar Akun Belanja</span>
                <h3 className="font-bold text-slate-900 text-lg mt-0.5">Penyerapan Anggaran</h3>
              </div>
              <button 
                onClick={() => onNavigate('budget')}
                className="text-xs font-bold text-blue-600 hover:text-blue-850 flex items-center gap-1 cursor-pointer transition-colors bg-slate-50 px-3 py-1.5 rounded-xl"
              >
                Semua Rekening <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {rekening.slice(0, 4).map((item, index) => {
                const itemPercent = item.pagu > 0 ? (item.realisasi / item.pagu) * 100 : 0;
                return (
                  <div key={item.id} className="space-y-1 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start text-xs">
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="font-mono text-slate-400 font-semibold text-[10px] block">{item.kode}</span>
                        <p className="font-bold text-slate-800 truncate text-xs">{item.uraian}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{itemPercent.toFixed(1)}%</span>
                        <p className="text-slate-400 font-mono text-[9px]">{formatRupiah(item.realisasi)} / {formatRupiah(item.pagu)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(itemPercent, 100)}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-1.5 rounded-full ${
                          itemPercent > 90 ? 'bg-indigo-600' :
                          itemPercent > 50 ? 'bg-emerald-500' :
                          itemPercent > 10 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rekapitulasi Buku Pembantu Pajak - Large Bento Card */}
        <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">Kas Negara</span>
                <h3 className="font-bold text-slate-900 text-lg mt-0.5">Buku Pembantu Pajak</h3>
              </div>
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 font-mono">
                Total: {formatRupiah(totalPajak)}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'PPN 11%', value: totalPPN, color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-100/70' },
                { label: 'PPh 21', value: totalPPh21, color: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100/70' },
                { label: 'PPh 22 (1.5%)', value: totalPPh22, color: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100/70' },
                { label: 'PPh 23 (2%)', value: totalPPh23, color: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-100/70' },
                { label: 'Pajak Daerah', value: totalPajakDaerah, color: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-100/70' },
              ].map((tax, i) => (
                <div key={i} className={`p-3 rounded-2xl border ${tax.border} bg-white flex flex-col justify-between space-y-2`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${tax.color}`} />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{tax.label}</span>
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-800 block leading-none">
                      {formatRupiah(tax.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Pie-like visualizer */}
          {totalPajak > 0 ? (
            <div className="mt-6 flex h-2 rounded-full overflow-hidden bg-slate-100">
              {totalPPN > 0 && <div className="bg-blue-500" style={{ width: `${(totalPPN / totalPajak) * 100}%` }} title={`PPN: ${((totalPPN / totalPajak) * 100).toFixed(1)}%`} />}
              {totalPPh21 > 0 && <div className="bg-emerald-500" style={{ width: `${(totalPPh21 / totalPajak) * 100}%` }} title={`PPh 21: ${((totalPPh21 / totalPajak) * 100).toFixed(1)}%`} />}
              {totalPPh22 > 0 && <div className="bg-amber-500" style={{ width: `${(totalPPh22 / totalPajak) * 100}%` }} title={`PPh 22: ${((totalPPh22 / totalPajak) * 100).toFixed(1)}%`} />}
              {totalPPh23 > 0 && <div className="bg-purple-500" style={{ width: `${(totalPPh23 / totalPajak) * 100}%` }} title={`PPh 23: ${((totalPPh23 / totalPajak) * 100).toFixed(1)}%`} />}
              {totalPajakDaerah > 0 && <div className="bg-pink-500" style={{ width: `${(totalPajakDaerah / totalPajak) * 100}%` }} title={`Pajak Daerah: ${((totalPajakDaerah / totalPajak) * 100).toFixed(1)}%`} />}
            </div>
          ) : (
            <div className="mt-6 text-center text-[10px] text-slate-400 font-medium">Belum ada pemotongan pajak belanja terdaftar</div>
          )}
        </div>

        {/* Layanan Cepat - Sleek Dark Slate Bento Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between min-h-[320px] text-white">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">Akses Pintas</span>
            <h4 className="text-white font-bold text-lg mt-1">Layanan Cepat</h4>
            
            <div className="space-y-2 mt-4">
              <button
                onClick={() => onNavigate('documents')}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-750 text-left transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="font-semibold text-xs block text-white truncate">Buat SPJ Baru</span>
                  <span className="text-[10px] text-slate-400 block truncate">Kwitansi & BAP</span>
                </div>
              </button>

              <button
                onClick={() => onNavigate('taxes')}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-750 text-left transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="font-semibold text-xs block text-white truncate">Kalkulator Pajak</span>
                  <span className="text-[10px] text-slate-400 block truncate">PPN 11% & PPh</span>
                </div>
              </button>

              <button
                onClick={() => onNavigate('budget')}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-750 text-left transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="font-semibold text-xs block text-white truncate">Anggaran DPA</span>
                  <span className="text-[10px] text-slate-400 block truncate font-mono">SIPD 2026</span>
                </div>
              </button>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 font-mono mt-4 border-t border-slate-800 pt-3 flex justify-between items-center">
            <span>SISTEM INTEGRITAS</span>
            <span className="text-amber-400 font-bold uppercase">SIPD</span>
          </div>
        </div>

        {/* Arsip Dokumen / Recent SPJ Activity - Wide Bento Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">Audit Log</span>
                <h3 className="font-bold text-slate-900 text-lg mt-0.5">Arsip Dokumen Terbaru</h3>
              </div>
              <button 
                onClick={() => onNavigate('documents')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors bg-slate-50 px-3 py-1.5 rounded-xl"
              >
                Semua Arsip <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentDokumen.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">Belum ada dokumen yang dibuat</p>
                <p className="text-xs">Gunakan menu layanan cepat di atas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDokumen.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => {
                      onNavigate('documents');
                      onSelectDokumen(doc);
                    }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        doc.jenis === 'Kwitansi' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        doc.jenis === 'BAP' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        doc.jenis === 'NPD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                        {doc.jenis.slice(0, 3)}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-slate-900 font-mono truncate block">
                          {doc.nomor}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {doc.uraian}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 border-slate-100 pt-1.5 sm:pt-0">
                      <span className="text-xs font-mono font-bold text-slate-900 block">
                        {formatRupiah(doc.nilai)}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 block">{doc.tanggal}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tip / Kepatuhan - Small Bento Card */}
        <div className="col-span-1 bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 mb-4">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <h4 className="text-indigo-950 font-bold text-base">Standar Kepatuhan</h4>
            <p className="text-indigo-700/80 text-xs mt-2 leading-relaxed">
              Sistem teroptimasi secara real-time berdasarkan aturan perpajakan Bendahara Pengeluaran (PMK RI) dan Buku Pembantu Kas SIPD Kementerian Dalam Negeri.
            </p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-indigo-100 flex justify-between items-center text-[10px] text-indigo-500 font-mono">
            <span>DOKUMEN VALID</span>
            <div className="px-2 py-1 bg-white rounded-lg border border-indigo-200">TA 2026</div>
          </div>
        </div>

      </div>
    </div>
  );
}
