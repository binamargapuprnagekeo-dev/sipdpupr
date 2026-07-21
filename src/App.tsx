import { useState, useEffect } from 'react';
import { 
  Building, 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Calculator, 
  Settings as SettingsIcon,
  HelpCircle,
  TrendingUp,
  Stamp,
  Printer,
  Video
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import DocumentGenerator from './components/DocumentGenerator';
import BudgetManager from './components/BudgetManager';
import TaxCalculator from './components/TaxCalculator';
import Settings from './components/Settings';
import Coordination from './components/Coordination';
import { Dokumen, RekeningAnggaran, CatatanPajak, Pejabat } from './types';
import { 
  DEFAULT_REKENING, 
  DEFAULT_DOKUMEN, 
  DEFAULT_PAJAK, 
  DEFAULT_PEJABAT 
} from './data/defaultData';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut 
} from './utils/firebaseAuth';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Google Auth states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Initialize Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setGoogleUser(currentUser);
        setGoogleToken(currentToken);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (e) {
      console.error('Google login failed:', e);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleToken(null);
    } catch (e) {
      console.error('Google logout failed:', e);
    }
  };

  // Selected document to view in generator (from recent clicks on Dashboard)
  const [selectedExternalDoc, setSelectedExternalDoc] = useState<Dokumen | null>(null);

  // Global administrative states (Persisted in LocalStorage)
  const [rekening, setRekening] = useState<RekeningAnggaran[]>([]);
  const [dokumen, setDokumen] = useState<Dokumen[]>([]);
  const [pajak, setPajak] = useState<CatatanPajak[]>([]);
  const [pejabat, setPejabat] = useState<Pejabat[]>([]);

  // Load from LocalStorage or seed defaults (default to empty to keep app blank)
  useEffect(() => {
    const cachedRekening = localStorage.getItem('pupr_rekening');
    const cachedDokumen = localStorage.getItem('pupr_dokumen');
    const cachedPajak = localStorage.getItem('pupr_pajak');
    const cachedPejabat = localStorage.getItem('pupr_pejabat');

    if (cachedRekening) {
      setRekening(JSON.parse(cachedRekening));
    } else {
      setRekening([]);
      localStorage.setItem('pupr_rekening', JSON.stringify([]));
    }

    if (cachedDokumen) {
      setDokumen(JSON.parse(cachedDokumen));
    } else {
      setDokumen([]);
      localStorage.setItem('pupr_dokumen', JSON.stringify([]));
    }

    if (cachedPajak) {
      setPajak(JSON.parse(cachedPajak));
    } else {
      setPajak([]);
      localStorage.setItem('pupr_pajak', JSON.stringify([]));
    }

    if (cachedPejabat) {
      setPejabat(JSON.parse(cachedPejabat));
    } else {
      setPejabat([]);
      localStorage.setItem('pupr_pejabat', JSON.stringify([]));
    }
  }, []);

  // Sync utilities
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // 1. Budget Account handlers
  const handleAddRekening = (newItem: Omit<RekeningAnggaran, 'id' | 'realisasi'>) => {
    const updated = [
      ...rekening,
      {
        ...newItem,
        id: `rek-${Date.now()}`,
        realisasi: 0
      }
    ];
    setRekening(updated);
    saveState('pupr_rekening', updated);
  };

  const handleUpdateRekening = (updatedItem: RekeningAnggaran) => {
    const updated = rekening.map(item => item.id === updatedItem.id ? updatedItem : item);
    setRekening(updated);
    saveState('pupr_rekening', updated);
  };

  const handleDeleteRekening = (id: string) => {
    const updated = rekening.filter(item => item.id !== id);
    setRekening(updated);
    saveState('pupr_rekening', updated);
  };

  // 2. Document core handlers
  const handleAddDokumen = (newDoc: Dokumen) => {
    const updatedDocs = [...dokumen, newDoc];
    setDokumen(updatedDocs);
    saveState('pupr_dokumen', updatedDocs);

    // Automatically update the matching budget account's realization!
    if (newDoc.rekeningId) {
      const updatedRekening = rekening.map(rek => {
        if (rek.id === newDoc.rekeningId) {
          return {
            ...rek,
            realisasi: rek.realisasi + newDoc.nilai
          };
        }
        return rek;
      });
      setRekening(updatedRekening);
      saveState('pupr_rekening', updatedRekening);
    }

    // Automatically log taxes to Buku Pembantu Pajak if taxes exist
    const hasTaxes = Object.values(newDoc.pajak).some(val => val > 0);
    if (hasTaxes) {
      const linkedRek = rekening.find(r => r.id === newDoc.rekeningId);
      const linkedRekeningCode = linkedRek ? linkedRek.kode : 'Umum';
      const linkedRekeningPayee = pejabat.find(p => p.id === newDoc.rekananId)?.nama || newDoc.manualRekananNama || '';

      const newTaxLog: CatatanPajak = {
        id: `pj-${Date.now()}`,
        dokumenId: newDoc.id,
        noBukti: `PJ-${newDoc.nomor.split('/')[2] || 'TAX'}`,
        tanggal: newDoc.tanggal,
        kodeRekening: linkedRekeningCode,
        uraian: `Potongan Pajak atas: ${newDoc.uraian.slice(0, 50)}...`,
        ppn: newDoc.pajak.ppn,
        pph21: newDoc.pajak.pph21,
        pph22: newDoc.pajak.pph22,
        pph23: newDoc.pajak.pph23,
        daerah: newDoc.pajak.daerah,
        total: newDoc.totalPajak,
        pihakMenerima: linkedRekeningPayee
      };

      const updatedPajak = [...pajak, newTaxLog];
      setPajak(updatedPajak);
      saveState('pupr_pajak', updatedPajak);
    }
  };

  const handleUpdateDokumen = (updatedDoc: Dokumen) => {
    // Recompute budget realization differences
    const oldDoc = dokumen.find(d => d.id === updatedDoc.id);
    let updatedRekening = [...rekening];

    if (oldDoc) {
      // Revert old budget realization
      if (oldDoc.rekeningId) {
        updatedRekening = updatedRekening.map(rek => 
          rek.id === oldDoc.rekeningId 
            ? { ...rek, realisasi: Math.max(0, rek.realisasi - oldDoc.nilai) } 
            : rek
        );
      }
      
      // Add new budget realization
      if (updatedDoc.rekeningId) {
        updatedRekening = updatedRekening.map(rek => 
          rek.id === updatedDoc.rekeningId 
            ? { ...rek, realisasi: rek.realisasi + updatedDoc.nilai } 
            : rek
        );
      }
      setRekening(updatedRekening);
      saveState('pupr_rekening', updatedRekening);
    }

    const updatedDocs = dokumen.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc);
    setDokumen(updatedDocs);
    saveState('pupr_dokumen', updatedDocs);
  };

  const handleDeleteDokumen = (id: string) => {
    const docToDelete = dokumen.find(d => d.id === id);
    if (docToDelete) {
      // Revert budget realizations
      if (docToDelete.rekeningId) {
        const updatedRekening = rekening.map(rek => 
          rek.id === docToDelete.rekeningId 
            ? { ...rek, realisasi: Math.max(0, rek.realisasi - docToDelete.nilai) } 
            : rek
        );
        setRekening(updatedRekening);
        saveState('pupr_rekening', updatedRekening);
      }

      // Revert tax entries linked to this document
      const updatedPajak = pajak.filter(pj => pj.dokumenId !== id);
      setPajak(updatedPajak);
      saveState('pupr_pajak', updatedPajak);
    }

    const updatedDocs = dokumen.filter(doc => doc.id !== id);
    setDokumen(updatedDocs);
    saveState('pupr_dokumen', updatedDocs);
  };

  // 3. Tax ledger handlers
  const handleAddPajakLog = (newLog: Omit<CatatanPajak, 'id'>) => {
    const updated = [
      ...pajak,
      {
        ...newLog,
        id: `pj-${Date.now()}`
      }
    ];
    setPajak(updated);
    saveState('pupr_pajak', updated);
  };

  const handleDeletePajakLog = (id: string) => {
    const updated = pajak.filter(item => item.id !== id);
    setPajak(updated);
    saveState('pupr_pajak', updated);
  };

  // 4. Pejabat/Officials handlers
  const handleAddPejabat = (newPerson: Omit<Pejabat, 'id'>) => {
    const updated = [
      ...pejabat,
      {
        ...newPerson,
        id: `pejabat-${Date.now()}`
      }
    ];
    setPejabat(updated);
    saveState('pupr_pejabat', updated);
  };

  const handleDeletePejabat = (id: string) => {
    const updated = pejabat.filter(p => p.id !== id);
    setPejabat(updated);
    saveState('pupr_pejabat', updated);
  };

  // 5. System export/import resets
  const handleExportData = () => {
    const exportBundle = {
      rekening,
      dokumen,
      pajak,
      pejabat,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PUPR_Nagekeo_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (dataStr: string): boolean => {
    try {
      const parsed = JSON.parse(dataStr);
      if (parsed.rekening && parsed.dokumen && parsed.pajak && parsed.pejabat) {
        setRekening(parsed.rekening);
        setDokumen(parsed.dokumen);
        setPajak(parsed.pajak);
        setPejabat(parsed.pejabat);

        saveState('pupr_rekening', parsed.rekening);
        saveState('pupr_dokumen', parsed.dokumen);
        saveState('pupr_pajak', parsed.pajak);
        saveState('pupr_pejabat', parsed.pejabat);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleResetData = () => {
    localStorage.setItem('pupr_rekening', JSON.stringify(DEFAULT_REKENING));
    localStorage.setItem('pupr_dokumen', JSON.stringify(DEFAULT_DOKUMEN));
    localStorage.setItem('pupr_pajak', JSON.stringify(DEFAULT_PAJAK));
    localStorage.setItem('pupr_pejabat', JSON.stringify(DEFAULT_PEJABAT));

    setRekening(DEFAULT_REKENING);
    setDokumen(DEFAULT_DOKUMEN);
    setPajak(DEFAULT_PAJAK);
    setPejabat(DEFAULT_PEJABAT);
  };

  const handleClearData = () => {
    localStorage.setItem('pupr_rekening', JSON.stringify([]));
    localStorage.setItem('pupr_dokumen', JSON.stringify([]));
    localStorage.setItem('pupr_pajak', JSON.stringify([]));
    localStorage.setItem('pupr_pejabat', JSON.stringify([]));

    setRekening([]);
    setDokumen([]);
    setPajak([]);
    setPejabat([]);
  };

  const handleSelectRecentDokumen = (doc: Dokumen) => {
    setSelectedExternalDoc(doc);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* 1. Header (Hidden during Print) */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-850 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-xl text-slate-950 font-bold shrink-0 shadow-sm shadow-amber-300/10">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">SIPD & Sistem SPJ</span>
                <span className="text-[9px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-sm">TA 2026</span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight uppercase leading-none mt-0.5">
                Dinas PUPR Kabupaten Nagekeo
              </h1>
            </div>
          </div>

          {/* Quick Stats Indicator */}
          <div className="flex items-center gap-3 bg-slate-850 p-2 rounded-xl border border-slate-800 text-xs text-slate-300">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold leading-none">TOTAL ARSIP</span>
              <strong className="font-mono text-white text-sm">{dokumen.length} Dokumen</strong>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Primary Navigation Tabs (Hidden during Print) */}
      <nav className="bg-white border-b border-slate-200 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-1 sm:space-x-4 py-2.5 no-scrollbar">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'documents', label: 'Generator Dokumen', icon: FileText },
              { id: 'budget', label: 'Daftar Anggaran', icon: Receipt },
              { id: 'taxes', label: 'Kalkulator Pajak', icon: Calculator },
              { id: 'coordination', label: 'Rapat & Koordinasi', icon: Video },
              { id: 'settings', label: 'Personil & Database', icon: SettingsIcon },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. Main Workspace Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' && (
          <Dashboard 
            rekening={rekening}
            dokumen={dokumen}
            pajak={pajak}
            onNavigate={setActiveTab}
            onSelectDokumen={handleSelectRecentDokumen}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentGenerator 
            dokumen={dokumen}
            pejabat={pejabat}
            rekening={rekening}
            onAddDokumen={handleAddDokumen}
            onUpdateDokumen={handleUpdateDokumen}
            onDeleteDokumen={handleDeleteDokumen}
            selectedExternalDokumen={selectedExternalDoc}
            onClearSelectedExternalDokumen={() => setSelectedExternalDoc(null)}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetManager 
            rekening={rekening}
            dokumen={dokumen}
            onAddRekening={handleAddRekening}
            onUpdateRekening={handleUpdateRekening}
            onDeleteRekening={handleDeleteRekening}
          />
        )}

        {activeTab === 'taxes' && (
          <TaxCalculator 
            rekening={rekening}
            pajak={pajak}
            onAddPajakLog={handleAddPajakLog}
            onDeletePajakLog={handleDeletePajakLog}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            pejabat={pejabat}
            rekening={rekening}
            dokumen={dokumen}
            pajak={pajak}
            onAddPejabat={handleAddPejabat}
            onDeletePejabat={handleDeletePejabat}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            onClearData={handleClearData}
            setRekening={setRekening}
            setDokumen={setDokumen}
            setPajak={setPajak}
            setPejabat={setPejabat}
          />
        )}

        {activeTab === 'coordination' && (
          <Coordination 
            token={googleToken}
            user={googleUser}
            onLogin={handleGoogleLogin}
            onLogout={handleGoogleLogout}
            rekening={rekening}
            dokumen={dokumen}
            pajak={pajak}
            pejabat={pejabat}
          />
        )}

      </main>

      {/* 4. Footer (Hidden during Print) */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-500">Aplikasi Administrasi Keuangan Dinas Pekerjaan Umum dan Penataan Ruang</p>
          <p className="mt-1 text-slate-400">Pemerintah Kabupaten Nagekeo, Nusa Tenggara Timur • Tahun Anggaran 2026</p>
          <div className="flex justify-center gap-4 mt-2">
            <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">v1.0.0 Stable</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
