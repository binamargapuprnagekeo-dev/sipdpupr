import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Wallet, 
  Coins, 
  FileText, 
  CheckCircle,
  X,
  AlertTriangle,
  Bookmark
} from 'lucide-react';
import { RekeningAnggaran, Dokumen } from '../types';
import { formatRupiah } from '../utils/indonesianHelper';

interface BudgetManagerProps {
  rekening: RekeningAnggaran[];
  dokumen: Dokumen[];
  onAddRekening: (item: Omit<RekeningAnggaran, 'id' | 'realisasi'>) => void;
  onUpdateRekening: (item: RekeningAnggaran) => void;
  onDeleteRekening: (id: string) => void;
}

export default function BudgetManager({ 
  rekening, 
  dokumen,
  onAddRekening, 
  onUpdateRekening, 
  onDeleteRekening 
}: BudgetManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RekeningAnggaran | null>(null);
  const [selectedRekening, setSelectedRekening] = useState<RekeningAnggaran | null>(null);

  // Form states
  const [kode, setKode] = useState('');
  const [uraian, setUraian] = useState('');
  const [pagu, setPagu] = useState<number>(0);
  const [sumberDana, setSumberDana] = useState('DAU (Dana Alokasi Umum)');

  // Filtered rekening
  const filteredRekening = rekening.filter(item => 
    item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sumberDana.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setKode('');
    setUraian('');
    setPagu(0);
    setSumberDana('DAU (Dana Alokasi Umum)');
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: RekeningAnggaran) => {
    setEditingItem(item);
    setKode(item.kode);
    setUraian(item.uraian);
    setPagu(item.pagu);
    setSumberDana(item.sumberDana);
    setShowAddModal(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!kode || !uraian || pagu <= 0) {
      alert('Mohon isi semua field dengan benar!');
      return;
    }

    if (editingItem) {
      onUpdateRekening({
        ...editingItem,
        kode,
        uraian,
        pagu,
        sumberDana
      });
    } else {
      onAddRekening({
        kode,
        uraian,
        pagu,
        sumberDana
      });
    }

    setShowAddModal(false);
    resetForm();
  };

  // Get documents related to selected budget
  const getDokumenForRekening = (rekId: string) => {
    return dokumen.filter(doc => doc.rekeningId === rekId);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daftar Rekening Anggaran (SIPD)</h2>
          <p className="text-xs text-slate-500">Kelola rincian pagu, realisasi belanja, dan sisa anggaran untuk Dinas PUPR Nagekeo</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-100 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Tambah Rekening
        </button>
      </div>

      {/* Main interactive area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Account List (Left/Main Columns) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan kode rekening, uraian belanja, sumber dana..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-sm text-slate-800 placeholder-slate-400 font-medium transition-all"
            />
          </div>

          {filteredRekening.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-xs text-slate-400">
              <p className="text-base font-semibold">Tidak ada rekening anggaran ditemukan</p>
              <p className="text-xs">Coba cari kata kunci lain atau tambah rekening baru.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRekening.map((rek) => {
                const isSelected = selectedRekening?.id === rek.id;
                const percent = rek.pagu > 0 ? (rek.realisasi / rek.pagu) * 100 : 0;
                const docCount = getDokumenForRekening(rek.id).length;

                return (
                  <div
                    key={rek.id}
                    onClick={() => setSelectedRekening(isSelected ? null : rek)}
                    className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-md' 
                        : 'border-slate-200 hover:border-slate-350 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                            {rek.kode}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase">
                            <Bookmark className="w-2.5 h-2.5" /> {rek.sumberDana}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{rek.uraian}</h4>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(rek);
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer transition-colors"
                          title="Ubah Rekening"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Apakah Anda yakin ingin menghapus rekening anggaran ini?')) {
                              onDeleteRekening(rek.id);
                              if (selectedRekening?.id === rek.id) setSelectedRekening(null);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                          title="Hapus Rekening"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Financial Figures */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-50">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PAGU DPA</span>
                        <span className="font-mono text-xs font-bold text-slate-900">{formatRupiah(rek.pagu)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">REALISASI (LS/UP)</span>
                        <span className="font-mono text-xs font-bold text-emerald-600">{formatRupiah(rek.realisasi)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SISA PAGU</span>
                        <span className="font-mono text-xs font-bold text-slate-800">{formatRupiah(rek.pagu - rek.realisasi)}</span>
                      </div>
                    </div>

                    {/* Utilization Progress bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold">TINGKAT PENYERAPAN</span>
                        <span className="font-bold text-slate-800">{percent.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            percent > 90 ? 'bg-indigo-600' :
                            percent > 50 ? 'bg-emerald-500' :
                            percent > 0 ? 'bg-blue-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {docCount > 0 && (
                      <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                        <FileText className="w-3 h-3 text-indigo-500" /> {docCount} Dokumen Ditautkan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Details Panel */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-full min-h-[300px]">
            {selectedRekening ? (
              <div className="space-y-4">
                <div className="space-y-1 pb-4 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-slate-400">{selectedRekening.kode}</span>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedRekening.uraian}</h3>
                  <p className="text-xs text-slate-500">Sumber Dana: {selectedRekening.sumberDana}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Histori Realisasi Belanja</h4>
                  
                  {getDokumenForRekening(selectedRekening.id).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      <p>Belum ada realisasi pembayaran untuk rekening ini.</p>
                      <p className="mt-1">Buat Kwitansi atau NPD untuk mencatat pengeluaran belanja.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                      {getDokumenForRekening(selectedRekening.id).map((doc) => (
                        <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="font-mono font-bold text-slate-800 break-all leading-tight">
                              {doc.nomor.split('/')[2] || doc.nomor}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-100 text-[9px] font-bold text-slate-500">
                              {doc.jenis}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2 my-1">{doc.uraian}</p>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-150 text-[10px]">
                            <span className="text-slate-400">{doc.tanggal}</span>
                            <span className="font-mono font-bold text-indigo-700">{formatRupiah(doc.nilai)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1">
                  <span className="font-bold text-slate-800 block">Catatan Analisis:</span>
                  {selectedRekening.realisasi >= selectedRekening.pagu ? (
                    <p className="text-red-600 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Anggaran sudah habis / terpakai 100%.
                    </p>
                  ) : (
                    <p className="text-slate-600">
                      Masih terdapat sisa pagu sebesar <strong className="font-semibold">{formatRupiah(selectedRekening.pagu - selectedRekening.realisasi)}</strong> yang siap dicairkan untuk program kegiatan selanjutnya.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12 px-4">
                <Coins className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-700 text-sm">Informasi Rincian Belanja</h4>
                <p className="text-xs max-w-xs mt-1">Klik salah satu rekening anggaran di sebelah kiri untuk melihat rincian pemakaian, daftar pengeluaran, dan sisa pagu.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
              onClick={() => setShowAddModal(false)}
            />

            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all w-full max-w-md border border-slate-100"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-indigo-600" />
                    {editingItem ? 'Ubah Rekening Anggaran' : 'Tambah Rekening Anggaran'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sebutkan rincian akun belanja berdasarkan buku DPA Dinas PUPR Nagekeo</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Kode Rekening */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Kode Rekening (SIPD)</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 1.03.10.2.01.0053.5.2.04..."
                      value={kode}
                      onChange={(e) => setKode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono text-slate-800 placeholder-slate-400 transition-all"
                    />
                  </div>

                  {/* Uraian Belanja */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Uraian Belanja</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Uraian kegiatan atau pos pengeluaran belanja..."
                      value={uraian}
                      onChange={(e) => setUraian(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-800 placeholder-slate-400 transition-all resize-none"
                    />
                  </div>

                  {/* Pagu Anggaran */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Pagu Dana (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="0"
                        value={pagu || ''}
                        onChange={(e) => setPagu(parseInt(e.target.value, 10) || 0)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono text-slate-800 placeholder-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Sumber Dana */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Sumber Dana</label>
                    <select
                      value={sumberDana}
                      onChange={(e) => setSumberDana(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-800 transition-all bg-white"
                    >
                      <option value="DAU (Dana Alokasi Umum)">DAU (Dana Alokasi Umum)</option>
                      <option value="DAK (Dana Alokasi Khusus)">DAK (Dana Alokasi Khusus)</option>
                      <option value="PAD (Pendapatan Asli Daerah)">PAD (Pendapatan Asli Daerah)</option>
                      <option value="Dana Transfer Umum">Dana Transfer Umum</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm shadow-indigo-100"
                    >
                      {editingItem ? 'Simpan Perubahan' : 'Tambah Akun'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
