import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Users, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Building,
  Briefcase,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
  Lock,
  CloudLightning,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { Pejabat, RekeningAnggaran, Dokumen, CatatanPajak } from '../types';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken 
} from '../utils/firebaseAuth';
import { 
  searchSpreadsheet, 
  createSpreadsheet, 
  syncToSheets, 
  pullFromSheets 
} from '../utils/googleSheetsService';
import { User as FirebaseUser } from 'firebase/auth';

interface SettingsProps {
  pejabat: Pejabat[];
  rekening: RekeningAnggaran[];
  dokumen: Dokumen[];
  pajak: CatatanPajak[];
  onAddPejabat: (p: Omit<Pejabat, 'id'>) => void;
  onDeletePejabat: (id: string) => void;
  onExportData: () => void;
  onImportData: (dataStr: string) => boolean;
  onResetData: () => void;
  onClearData: () => void;
  setRekening: React.Dispatch<React.SetStateAction<RekeningAnggaran[]>>;
  setDokumen: React.Dispatch<React.SetStateAction<Dokumen[]>>;
  setPajak: React.Dispatch<React.SetStateAction<CatatanPajak[]>>;
  setPejabat: React.Dispatch<React.SetStateAction<Pejabat[]>>;
}

export default function Settings({
  pejabat,
  rekening,
  dokumen,
  pajak,
  onAddPejabat,
  onDeletePejabat,
  onExportData,
  onImportData,
  onResetData,
  onClearData,
  setRekening,
  setDokumen,
  setPajak,
  setPejabat
}: SettingsProps) {
  
  // Add official states
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [peran, setPeran] = useState<Pejabat['peran']>('Lainnya');
  const [instansi, setInstansi] = useState('Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo');
  const [alamat, setAlamat] = useState('');
  const [addMsg, setAddMsg] = useState('');

  // Import file state
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google Sheets Integration states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // PIN Protection Modal states
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinAction, setPinAction] = useState<'reset' | 'clear' | null>(null);
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  // Listen to Google Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setIsAuthLoading(false);
        checkSpreadsheet(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsAuthLoading(false);
        setSpreadsheetId(null);
      }
    );

    const savedLastSynced = localStorage.getItem('pupr_last_synced');
    if (savedLastSynced) setLastSynced(savedLastSynced);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const checkSpreadsheet = async (accessToken: string) => {
    try {
      const id = await searchSpreadsheet(accessToken);
      setSpreadsheetId(id);
    } catch (e) {
      console.error('Error finding sheet:', e);
    }
  };

  const handleLogin = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: 'info', text: 'Menghubungkan ke Akun Google...' });
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setSyncStatus({ type: 'success', text: 'Koneksi Akun Google Berhasil!' });
        await checkSpreadsheet(result.accessToken);
      }
    } catch (e: any) {
      setSyncStatus({ type: 'error', text: `Gagal masuk: ${e.message || e}` });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleLogout = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setToken(null);
      setSpreadsheetId(null);
      setSyncStatus({ type: 'success', text: 'Koneksi Akun Google telah diputus.' });
    } catch (e: any) {
      setSyncStatus({ type: 'error', text: `Gagal keluar: ${e.message}` });
    }
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!token) return;
    setIsSyncing(true);
    setSyncStatus({ type: 'info', text: 'Memeriksa keberadaan spreadsheet di Google Drive...' });
    try {
      const existingId = await searchSpreadsheet(token);
      if (existingId) {
        setSpreadsheetId(existingId);
        setSyncStatus({ type: 'success', text: 'Spreadsheet "SIPD PUPR Nagekeo 2026" yang sudah ada berhasil ditemukan dan dihubungkan!' });
      } else {
        setSyncStatus({ type: 'info', text: 'Membuat spreadsheet baru di Google Drive Anda...' });
        const id = await createSpreadsheet(token);
        setSpreadsheetId(id);
        setSyncStatus({ type: 'success', text: 'Spreadsheet "SIPD PUPR Nagekeo 2026" berhasil dibuat di Drive Anda!' });
      }
    } catch (e: any) {
      setSyncStatus({ type: 'error', text: `Gagal menginisialisasi spreadsheet: ${e.message || e}` });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handlePushToSheets = async () => {
    if (!token) {
      alert('Silakan sambungkan akun Google Anda terlebih dahulu.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus({ type: 'info', text: 'Memeriksa keberadaan spreadsheet...' });
    try {
      let activeSpreadsheetId = spreadsheetId;
      if (!activeSpreadsheetId) {
        setSyncStatus({ type: 'info', text: 'Mengecek apakah spreadsheet sudah ada di Google Drive...' });
        const existingId = await searchSpreadsheet(token);
        if (existingId) {
          activeSpreadsheetId = existingId;
          setSpreadsheetId(existingId);
          setSyncStatus({ type: 'info', text: 'Menemukan spreadsheet yang sudah ada. Menyelaraskan...' });
        } else {
          setSyncStatus({ type: 'info', text: 'Spreadsheet belum ada, membuat spreadsheet baru...' });
          activeSpreadsheetId = await createSpreadsheet(token);
          setSpreadsheetId(activeSpreadsheetId);
        }
      }

      await syncToSheets(token, activeSpreadsheetId, {
        rekening,
        dokumen,
        pajak,
        pejabat
      });

      const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      setLastSynced(nowStr);
      localStorage.setItem('pupr_last_synced', nowStr);
      setSyncStatus({ type: 'success', text: 'Sinkronisasi Berhasil! Semua data lokal telah diperbarui ke Google Sheets.' });
    } catch (e: any) {
      setSyncStatus({ type: 'error', text: `Gagal menyinkronkan data: ${e.message || e}` });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 6000);
    }
  };

  const handlePullFromSheets = async () => {
    if (!token || !spreadsheetId) {
      alert('Spreadsheet tidak terdeteksi.');
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus({ type: 'info', text: 'Mengambil data teranyar dari Google Sheets...' });
    try {
      const pulled = await pullFromSheets(token, spreadsheetId);
      if (pulled) {
        setRekening(pulled.rekening);
        setDokumen(pulled.dokumen);
        setPajak(pulled.pajak);
        setPejabat(pulled.pejabat);

        localStorage.setItem('pupr_rekening', JSON.stringify(pulled.rekening));
        localStorage.setItem('pupr_dokumen', JSON.stringify(pulled.dokumen));
        localStorage.setItem('pupr_pajak', JSON.stringify(pulled.pajak));
        localStorage.setItem('pupr_pejabat', JSON.stringify(pulled.pejabat));

        const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
        setLastSynced(nowStr);
        localStorage.setItem('pupr_last_synced', nowStr);
        setSyncStatus({ type: 'success', text: 'Berhasil mengimpor! Data aplikasi telah disinkronkan sesuai data Google Sheets.' });
      } else {
        throw new Error('Spreadsheet kosong atau rusak.');
      }
    } catch (e: any) {
      setSyncStatus({ type: 'error', text: `Gagal mengambil data: ${e.message || e}` });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 6000);
    }
  };

  const handleAddOfficial = (e: FormEvent) => {
    e.preventDefault();
    if (!nama || !jabatan) {
      alert('Nama dan Jabatan wajib diisi!');
      return;
    }

    onAddPejabat({
      nama: nama.toUpperCase(),
      nip: nip || '-',
      jabatan,
      peran,
      instansi,
      alamat
    });

    setAddMsg('Pejabat baru berhasil ditambahkan ke database!');
    setNama('');
    setNip('');
    setJabatan('');
    setAlamat('');
    setTimeout(() => setAddMsg(''), 4000);
  };

  const handleImportFile = (e: FormEvent) => {
    e.preventDefault();
    if (!importText) return;

    const success = onImportData(importText);
    if (success) {
      setImportStatus({ type: 'success', text: 'Data administrasi berhasil diimpor dan dimuat!' });
      setImportText('');
    } else {
      setImportStatus({ type: 'error', text: 'Format cadangan JSON tidak valid. Impor dibatalkan.' });
    }
    setTimeout(() => setImportStatus(null), 5000);
  };

  // Open secure PIN modal for critical actions
  const openPinModal = (action: 'reset' | 'clear') => {
    setPinAction(action);
    setPinInput('');
    setPinErrorMsg('');
    setIsPinModalOpen(true);
  };

  const verifyPinAndExecute = () => {
    if (pinInput === 'sekdpupr2026') {
      setIsPinModalOpen(false);
      setPinInput('');
      setPinErrorMsg('');
      
      if (pinAction === 'reset') {
        onResetData();
        alert('Sistem berhasil dikembalikan ke data default template awal!');
      } else if (pinAction === 'clear') {
        onClearData();
        alert('Seluruh database berhasil dikosongkan!');
      }
    } else {
      setPinErrorMsg('PIN salah! Akses ditolak.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 font-sans">Pengaturan & Database Instansi</h2>
        <p className="text-xs text-slate-500">Kelola master data Pejabat/Rekanan, sinkronisasi Google Sheets, pencadangan sistem, serta keamanan database Dinas PUPR Nagekeo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Officials Ledger & Add Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* List of Officials */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2 pb-2 border-b border-slate-50">
              <Users className="w-5 h-5 text-indigo-600" /> Database Pejabat & Rekanan
            </h3>

            {pejabat.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <Users className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Database pejabat masih kosong.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Gunakan formulir di bawah untuk menambahkan personil atau rekanan baru.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                {pejabat.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{p.nama}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          p.peran === 'PPK' ? 'bg-amber-100 text-amber-800' :
                          p.peran === 'Bendahara' ? 'bg-blue-100 text-blue-800' :
                          p.peran === 'PPTK' ? 'bg-emerald-100 text-emerald-800' :
                          p.peran === 'Kadis' ? 'bg-indigo-100 text-indigo-800' :
                          p.peran === 'Rekanan' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {p.peran}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">NIP: {p.nip}</p>
                      <p className="text-xs text-slate-700 leading-snug">{p.jabatan}</p>
                      {p.alamat && <p className="text-[10px] text-slate-400 font-medium">Alamat: {p.alamat}</p>}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus ${p.nama} dari daftar pejabat?`)) {
                          onDeletePejabat(p.id);
                        }
                      }}
                      className="p-1.5 bg-white border border-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors shrink-0"
                      title="Hapus Pejabat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Official Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2 pb-2 border-b border-slate-50">
              <Plus className="w-5 h-5 text-indigo-600" /> Tambah Personil / Rekanan Baru
            </h3>

            {addMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> {addMsg}
              </div>
            )}

            <form onSubmit={handleAddOfficial} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: FRANSISKUS P.G DADJO, ST, MT"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* NIP */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">NIP (Gunakan '-' jika Rekanan)</label>
                <input
                  type="text"
                  placeholder="Contoh: 19780325 201001 1 015"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Jabatan Resmi */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Jabatan Dinas / Jabatan Rekanan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pejabat Pembuat Komitmen (PPK) Penyelenggaraan Jalan / Direktur CV..."
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Peran Sistem */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Peran / Otoritas Dokumen</label>
                <select
                  value={peran}
                  onChange={(e) => setPeran(e.target.value as Pejabat['peran'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs text-slate-800 bg-white"
                >
                  <option value="PPK">PPK (Pejabat Pembuat Komitmen)</option>
                  <option value="Bendahara">Bendahara Pengeluaran</option>
                  <option value="PPTK">PPTK (Pelaksana Teknis Kegiatan)</option>
                  <option value="Kadis">Kadis (Pengguna Anggaran)</option>
                  <option value="Rekanan">Pihak Kedua (Rekanan / Vendor)</option>
                  <option value="Lainnya">Lainnya / Umum</option>
                </select>
              </div>

              {/* Alamat */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Alamat Kantor / Domisili (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Kupang, Flores, dsb"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Instansi */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Instansi / Badan Usaha</label>
                <input
                  type="text"
                  placeholder="Contoh: Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo"
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="sm:col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Simpan ke Database
              </button>
            </form>
          </div>

        </div>

        {/* Right Column - Backup, Recovery and Database resets */}
        <div className="space-y-6">
          
          {/* Cloud Synchronization Panel */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-50">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Integrasi Google Sheets
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Sinkronisasikan database administrasi (Rekening, Dokumen, Pajak, Pejabat) langsung ke spreadsheet <strong>SIPD PUPR Nagekeo 2026</strong> milik Anda secara aman.
            </p>

            {isAuthLoading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-xs font-medium text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                <span>Memuat status otorisasi...</span>
              </div>
            ) : !user ? (
              <button
                type="button"
                onClick={handleLogin}
                disabled={isSyncing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CloudLightning className="w-4 h-4 text-white" /> Hubungkan Google Sheets
              </button>
            ) : (
              <div className="space-y-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Google Account'} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-slate-200" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center uppercase">
                        {user.displayName?.slice(0, 2) || 'G'}
                      </div>
                    )}
                    <div className="leading-none">
                      <span className="text-[10px] font-bold text-slate-800 block truncate max-w-[150px]">{user.displayName || 'Pengguna'}</span>
                      <span className="text-[9px] text-slate-450 truncate block max-w-[150px]">{user.email}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                    title="Putuskan Otorisasi"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-500">Spreadsheet:</span>
                    {spreadsheetId ? (
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">TERKONEKSI ✓</span>
                    ) : (
                      <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm">BELUM DIBUAT !</span>
                    )}
                  </div>
                  {spreadsheetId && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Aksi:</span>
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-xs"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-white" /> Buka Google Sheets
                        </a>
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 truncate select-all">
                        <span className="font-semibold text-slate-500">Spreadsheet ID:</span> {spreadsheetId}
                      </div>
                    </div>
                  )}
                  {lastSynced && (
                    <div className="flex items-center justify-between text-[9px] text-slate-450 italic mt-1 bg-white/70 px-2 py-1 rounded-md">
                      <span>Sinkronisasi Terakhir:</span>
                      <span className="font-bold text-slate-600">{lastSynced}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handlePushToSheets}
                    disabled={isSyncing}
                    className="py-2 px-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" /> PUSH (Simpan)
                  </button>
                  <button
                    type="button"
                    onClick={handlePullFromSheets}
                    disabled={isSyncing || !spreadsheetId}
                    className="py-2 px-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" /> PULL (Ambil)
                  </button>
                </div>

                {!spreadsheetId && (
                  <button
                    type="button"
                    onClick={handleCreateNewSpreadsheet}
                    disabled={isSyncing}
                    className="w-full mt-2 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Inisialisasi Spreadsheet Baru
                  </button>
                )}
              </div>
            )}

            {syncStatus && (
              <div className={`p-2.5 rounded-xl text-[10px] font-semibold leading-relaxed ${
                syncStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                syncStatus.type === 'error' ? 'bg-red-50 text-red-800 border border-red-100' :
                'bg-blue-50 text-blue-800 border border-blue-100'
              }`}>
                {syncStatus.text}
              </div>
            )}
          </div>

          {/* Backup Systems */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-50">
              Pencadangan & Pemulihan (JSON)
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Unduh seluruh file database transaksi, dokumen, dan rekening anggaran Anda ke komputer dalam format JSON standar sebagai cadangan, atau muat kembali cadangan lama Anda.
            </p>

            <button
              onClick={onExportData}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-slate-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" /> Ekspor Cadangan (.json)
            </button>

            {/* Import Form */}
            <form onSubmit={handleImportFile} className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-600 uppercase block">Impor File Cadangan</label>
              
              {importStatus && (
                <div className={`p-2.5 rounded-lg text-[10px] font-semibold ${
                  importStatus.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                    : 'bg-red-50 text-red-800 border border-red-100'
                }`}>
                  {importStatus.text}
                </div>
              )}

              <textarea
                rows={3}
                placeholder="Tempel teks JSON hasil ekspor cadangan Anda di sini..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-[10px] font-mono leading-normal resize-none"
              />
              
              <button
                type="submit"
                disabled={!importText}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" /> Muat Cadangan (Restore)
              </button>
            </form>
          </div>

          {/* Reset System Database */}
          <div className="bg-red-50/50 p-5 rounded-3xl border border-red-200 space-y-3.5">
            <h3 className="font-bold text-red-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" /> Zona Bahaya
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini memerlukan PIN Keamanan Dinas PUPR. Anda dapat mengosongkan seluruh database aplikasi atau memulihkan kembali ke data template dokumen awal.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => openPinModal('clear')}
                className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-700" /> Kosongkan Semua Database
              </button>

              <button
                type="button"
                onClick={() => openPinModal('reset')}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-white" /> Kembalikan ke Template Awal
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* PIN Security Modal Overlay */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2.5 bg-red-50 rounded-xl">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Verifikasi PIN Keamanan</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Akses dilindungi untuk mencegah kehilangan data tidak disengaja</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase block">Masukkan PIN Otoritas Dinas PUPR</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') verifyPinAndExecute();
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-center tracking-widest font-mono text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus
                />
                
                {pinErrorMsg && (
                  <p className="text-[10px] font-semibold text-red-600 flex items-center gap-1 justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {pinErrorMsg}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={verifyPinAndExecute}
                  className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Konfirmasi Akses
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
