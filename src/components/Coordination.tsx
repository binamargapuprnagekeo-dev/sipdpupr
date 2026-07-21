import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Presentation, 
  Users, 
  Calendar, 
  Clock, 
  Mail, 
  ExternalLink, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Copy,
  Info,
  ArrowRight,
  Send,
  Loader2,
  Lock
} from 'lucide-react';
import { RekeningAnggaran, Dokumen, CatatanPajak, Pejabat } from '../types';

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

interface CoordinationProps {
  token: string | null;
  user: any;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  rekening: RekeningAnggaran[];
  dokumen: Dokumen[];
  pajak: CatatanPajak[];
  pejabat: Pejabat[];
}

interface Rapat {
  id: string;
  summary: string;
  description: string;
  meetLink: string;
  start: string;
  attendees: string[];
}

export default function Coordination({
  token,
  user,
  onLogin,
  onLogout,
  rekening,
  dokumen,
  pajak,
  pejabat
}: CoordinationProps) {
  // Tabs: 'meet' | 'slides' | 'contacts'
  const [activeSubTab, setActiveSubTab] = useState<'meet' | 'slides' | 'contacts'>('meet');

  // Meet States
  const [rapatList, setRapatList] = useState<Rapat[]>([]);
  const [loadingMeet, setLoadingMeet] = useState(false);
  const [title, setTitle] = useState('Koordinasi Validasi SPJ Dinas PUPR Nagekeo');
  const [desc, setDesc] = useState('Pembahasan kelengkapan berkas pertanggungjawaban (Kwitansi, BAP, NPD, SPTJM) dan setoran pajak.');
  const [meetDate, setMeetDate] = useState('2026-07-22');
  const [meetTime, setMeetTime] = useState('09:00');
  const [emails, setEmails] = useState<string[]>(['bkad.nagekeo@gmail.com', 'pajak.mbay@gmail.com']);
  const [newEmail, setNewEmail] = useState('');
  const [meetSuccess, setMeetSuccess] = useState<string | null>(null);
  const [meetError, setMeetError] = useState<string | null>(null);

  // Slides States
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [slideLink, setSlideLink] = useState<string | null>(null);
  const [slideSuccess, setSlideSuccess] = useState<string | null>(null);
  const [slideError, setSlideError] = useState<string | null>(null);
  const [includeBudget, setIncludeBudget] = useState(true);
  const [includeDocs, setIncludeDocs] = useState(true);
  const [includeTaxes, setIncludeTaxes] = useState(true);

  // Load meeting list from local storage or calendar
  useEffect(() => {
    const saved = localStorage.getItem('pupr_rapat_list');
    if (saved) {
      setRapatList(JSON.parse(saved));
    } else {
      // Seed initial sample meetings
      const sample = [
        {
          id: 'meet-sample-1',
          summary: 'Rapat Sinkronisasi Belanja Modal Dinas PUPR & BKAD',
          description: 'Koordinasi pencocokan pencairan dana NPD dengan Surat Penyediaan Dana (SPD) di BKAD.',
          meetLink: 'https://meet.google.com/abc-defg-hij',
          start: '2026-07-21T10:00:00+08:00',
          attendees: ['bkad.nagekeo@gmail.com', 'keuangan.pupr.nagekeo@gmail.com']
        }
      ];
      setRapatList(sample);
      localStorage.setItem('pupr_rapat_list', JSON.stringify(sample));
    }
  }, []);

  // Fetch upcoming meetings from Google Calendar API
  const fetchCalendarEvents = async () => {
    if (!token) return;
    try {
      setLoadingMeet(true);
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=' + new Date().toISOString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const events = data.items || [];
        
        // Filter events containing meet links or related to PUPR
        const formatted: Rapat[] = events
          .filter((ev: any) => ev.conferenceData?.entryPoints?.some((ep: any) => ep.entryPointType === 'video') || ev.summary?.toLowerCase().includes('pupr') || ev.summary?.toLowerCase().includes('spj'))
          .map((ev: any) => {
            const meetEp = ev.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video');
            return {
              id: ev.id,
              summary: ev.summary || 'Rapat Koordinasi',
              description: ev.description || '',
              meetLink: meetEp ? meetEp.uri : 'https://meet.google.com',
              start: ev.start?.dateTime || ev.start?.date || '',
              attendees: ev.attendees?.map((a: any) => a.email) || []
            };
          });
        
        if (formatted.length > 0) {
          setRapatList(formatted);
          localStorage.setItem('pupr_rapat_list', JSON.stringify(formatted));
        }
      }
    } catch (e) {
      console.error('Gagal mengambil data kalender:', e);
    } finally {
      setLoadingMeet(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCalendarEvents();
    }
  }, [token]);

  // Handle adding attendee email
  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      alert('Masukkan format email yang valid.');
      return;
    }
    if (emails.includes(newEmail)) {
      alert('Email sudah ditambahkan.');
      return;
    }
    setEmails([...emails, newEmail]);
    setNewEmail('');
  };

  const handleRemoveEmail = (idx: number) => {
    setEmails(emails.filter((_, i) => i !== idx));
  };

  // Create Google Meet event on Google Calendar
  const handleCreateMeet = async () => {
    if (!token) return;
    setLoadingMeet(true);
    setMeetSuccess(null);
    setMeetError(null);

    const startDateTime = `${meetDate}T${meetTime}:00`;
    const endHour = parseInt(meetTime.split(':')[0]) + 1;
    const endFormattedHour = endHour < 10 ? `0${endHour}` : `${endHour}`;
    const endDateTime = `${meetDate}T${endFormattedHour}:${meetTime.split(':')[1]}:00`;

    // Format attendees
    const formattedAttendees = emails.map(email => ({ email }));

    const eventPayload = {
      summary: title,
      description: desc,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Makassar' // WITA timezone for Nagekeo
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Makassar'
      },
      conferenceData: {
        createRequest: {
          requestId: `pupr-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      attendees: formattedAttendees
    };

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Gagal membuat rapat');
      }

      const eventData = await response.json();
      const meetEp = eventData.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video');
      const finalMeetLink = meetEp ? meetEp.uri : 'https://meet.google.com';

      const newRapat: Rapat = {
        id: eventData.id || `meet-${Date.now()}`,
        summary: eventData.summary || title,
        description: eventData.description || desc,
        meetLink: finalMeetLink,
        start: eventData.start?.dateTime || `${startDateTime}+08:00`,
        attendees: emails
      };

      const updatedList = [newRapat, ...rapatList];
      setRapatList(updatedList);
      localStorage.setItem('pupr_rapat_list', JSON.stringify(updatedList));

      setMeetSuccess(`Rapat "${title}" berhasil dijadwalkan dengan Google Meet link: ${finalMeetLink}`);
      
      // Reset form
      setTitle('Koordinasi Validasi SPJ Dinas PUPR Nagekeo');
      setDesc('Pembahasan kelengkapan berkas pertanggungjawaban (Kwitansi, BAP, NPD, SPTJM) dan setoran pajak.');
    } catch (e: any) {
      setMeetError(e.message || 'Gagal mengagendakan rapat Google Meet.');
    } finally {
      setLoadingMeet(false);
    }
  };

  // Generate Presentation in Google Slides
  const handleGenerateSlides = async () => {
    if (!token) return;
    setLoadingSlides(true);
    setSlideSuccess(null);
    setSlideError(null);
    setSlideLink(null);

    try {
      // 1. Create a brand new presentation slide deck
      const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Laporan SPJ & Penatausahaan Anggaran PUPR Nagekeo TA 2026'
        })
      });

      if (!createRes.ok) {
        throw new Error('Gagal menginisialisasi Google Slides baru.');
      }

      const presentation = await createRes.json();
      const presentationId = presentation.presentationId;

      // 2. Prepare slides update requests
      const requests: any[] = [];

      // We'll create Slide IDs dynamically
      const slideIds = {
        title: 'slide_title_page',
        budget: 'slide_budget_page',
        docs: 'slide_docs_page',
        taxes: 'slide_taxes_page'
      };

      // Since Slide 1 exists by default, let's find it or use it.
      // It's safer to create new slides with unique IDs and delete the first slide, or simply add layouts.
      // To ensure reliability across environments, let's create custom slides with explicit IDs:
      
      // SLIDE 1 (TITLE SLIDE) - Edit default or create custom
      // We will create Slide 1 as a TITLE slide
      requests.push({
        createSlide: {
          objectId: slideIds.title,
          insertionIndex: 0,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY'
          }
        }
      });

      // Write text on Title Slide
      requests.push({
        createShape: {
          objectId: 'title_box',
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageId: slideIds.title,
            size: {
              width: { magnitude: 650, unit: 'PT' },
              height: { magnitude: 150, unit: 'PT' }
            },
            transform: {
              scaleX: 1, scaleY: 1,
              translateX: 35, translateY: 40,
              unit: 'PT'
            }
          }
        }
      });

      requests.push({
        insertText: {
          objectId: 'title_box',
          text: 'LAPORAN REKAPITULASI SPJ & PENATAUSAHAAN ANGGARAN\nDINAS PEKERJAAN UMUM DAN PENATAUSAHAAN RUANG\nKABUPATEN NAGEKEO'
        }
      });

      requests.push({
        createShape: {
          objectId: 'subtitle_box',
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageId: slideIds.title,
            size: {
              width: { magnitude: 650, unit: 'PT' },
              height: { magnitude: 120, unit: 'PT' }
            },
            transform: {
              scaleX: 1, scaleY: 1,
              translateX: 35, translateY: 210,
              unit: 'PT'
            }
          }
        }
      });

      requests.push({
        insertText: {
          objectId: 'subtitle_box',
          text: `Dibuat secara otomatis oleh: Aplikasi SIPD Dinas PUPR Nagekeo\nTanggal Presentasi: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\nTahun Anggaran: 2026\n\nBahan Koordinasi Lintas Bidang & Bagian Keuangan`
        }
      });

      // SLIDE 2: BUDGETS
      if (includeBudget) {
        requests.push({
          createSlide: {
            objectId: slideIds.budget,
            insertionIndex: 1,
            slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
          }
        });

        // Title of Budget Slide
        requests.push({
          createShape: {
            objectId: 'budget_title',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slideIds.budget,
              size: { width: { magnitude: 650, unit: 'PT' }, height: { magnitude: 50, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 35, translateY: 30, unit: 'PT' }
            }
          }
        });
        requests.push({
          insertText: {
            objectId: 'budget_title',
            text: 'I. RINGKASAN REALISASI ANGGARAN PER REKENING'
          }
        });

        // Content of Budget Slide
        let budgetText = 'Daftar Alokasi & Realisasi Pagu Anggaran Dinas PUPR Nagekeo:\n\n';
        if (rekening.length === 0) {
          budgetText += '• Belum ada data rekening anggaran yang tercatat di sistem.';
        } else {
          rekening.forEach((rek, idx) => {
            const pct = rek.pagu > 0 ? ((rek.realisasi / rek.pagu) * 100).toFixed(1) : '0';
            budgetText += `${idx + 1}. [${rek.kode}] ${rek.uraian}\n   Pagu: ${formatRupiah(rek.pagu)} | Realisasi: ${formatRupiah(rek.realisasi)} (${pct}%)\n\n`;
          });
        }

        requests.push({
          createShape: {
            objectId: 'budget_body',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slideIds.budget,
              size: { width: { magnitude: 650, unit: 'PT' }, height: { magnitude: 280, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 35, translateY: 95, unit: 'PT' }
            }
          }
        });
        requests.push({
          insertText: {
            objectId: 'budget_body',
            text: budgetText
          }
        });
      }

      // SLIDE 3: RECENT DOCUMENTS
      if (includeDocs) {
        const insertionIdx = includeBudget ? 2 : 1;
        requests.push({
          createSlide: {
            objectId: slideIds.docs,
            insertionIndex: insertionIdx,
            slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
          }
        });

        // Title of Docs Slide
        requests.push({
          createShape: {
            objectId: 'docs_title',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slideIds.docs,
              size: { width: { magnitude: 650, unit: 'PT' }, height: { magnitude: 50, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 35, translateY: 30, unit: 'PT' }
            }
          }
        });
        requests.push({
          insertText: {
            objectId: 'docs_title',
            text: 'II. ARSIP & STATUS DOKUMEN PERTANGGUNGJAWABAN'
          }
        });

        // Content of Docs Slide
        let docsText = 'Daftar dokumen pengajuan SPJ terakhir:\n\n';
        if (dokumen.length === 0) {
          docsText += '• Belum ada dokumen SPJ / Kwitansi yang digenerate di sistem.';
        } else {
          // Display up to 5 latest docs
          const latestDocs = [...dokumen].reverse().slice(0, 5);
          latestDocs.forEach((doc, idx) => {
            docsText += `• No. ${doc.nomor}\n  Uraian: ${doc.uraian.slice(0, 65)}...\n  Nilai Belanja: ${formatRupiah(doc.nilai)} | Tanggal: ${doc.tanggal}\n\n`;
          });
          if (dokumen.length > 5) {
            docsText += `(... Dan ${dokumen.length - 5} berkas dokumen lainnya diarsip di sistem.)`;
          }
        }

        requests.push({
          createShape: {
            objectId: 'docs_body',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slideIds.docs,
              size: { width: { magnitude: 650, unit: 'PT' }, height: { magnitude: 280, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 35, translateY: 95, unit: 'PT' }
            }
          }
        });
        requests.push({
          insertText: {
            objectId: 'docs_body',
            text: docsText
          }
        });
      }

      // SLIDE 4: TAXES
      if (includeTaxes) {
        const insertionIdx = (includeBudget ? 1 : 0) + (includeDocs ? 1 : 0) + 1;
        requests.push({
          createSlide: {
            objectId: slideIds.taxes,
            insertionIndex: insertionIdx,
            slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
          }
        });

        // Title of Taxes Slide
        requests.push({
          createShape: {
            objectId: 'taxes_title',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slideIds.taxes,
              size: { width: { magnitude: 650, unit: 'PT' }, height: { magnitude: 50, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 35, translateY: 30, unit: 'PT' }
            }
          }
        });
        requests.push({
          insertText: {
            objectId: 'taxes_title',
            text: 'III. RINGKASAN SETORAN & KEPATUHAN PAJAK DAERAH'
          }
        });

        // Content of Taxes Slide
        // Summarize actual taxes from the system
        let totalPPN = 0;
        let totalPPh = 0;
        let totalDaerah = 0;
        pajak.forEach(pj => {
          totalPPN += pj.ppn || 0;
          totalPPh += (pj.pph21 || 0) + (pj.pph22 || 0) + (pj.pph23 || 0);
          totalDaerah += pj.daerah || 0;
        });

        const overallTax = totalPPN + totalPPh + totalDaerah;

        let taxesText = `Total Pajak yang Berhasil Dihitung & Disetor:\n`;
        taxesText += `• Nilai Akumulasi Setoran Pajak: ${formatRupiah(overallTax || 0)}\n\n`;
        taxesText += `Rincian Kategori Pajak:\n`;
        taxesText += `1. Pajak Pertambahan Nilai (PPN 11%): ${formatRupiah(totalPPN)}\n`;
        taxesText += `2. Pajak Penghasilan (PPh Pasal 21/22/23): ${formatRupiah(totalPPh)}\n`;
        taxesText += `3. Pajak Daerah / Galian C / Lainnya: ${formatRupiah(totalDaerah)}\n\n`;
        taxesText += `Informasi Koordinasi Pajak:\n`;
        taxesText += `• Kode Billing Pajak di-generate otomatis melalui integrasi e-Billing DJP Pajak.\n`;
        taxesText += `• Seluruh potongan pajak telah disisihkan dan siap disinkronisasikan ke Google Sheets Dinas Keuangan.`;

        requests.push({
          createShape: {
            objectId: 'taxes_body',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slideIds.taxes,
              size: { width: { magnitude: 650, unit: 'PT' }, height: { magnitude: 280, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 35, translateY: 95, unit: 'PT' }
            }
          }
        });
        requests.push({
          insertText: {
            objectId: 'taxes_body',
            text: taxesText
          }
        });
      }

      // 3. Fire the batchUpdate API call
      const updateRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      if (!updateRes.ok) {
        const updateErr = await updateRes.json();
        throw new Error(updateErr.error?.message || 'Gagal menyusun template slide presentasi.');
      }

      setSlideLink(`https://docs.google.com/presentations/d/${presentationId}`);
      setSlideSuccess(`Slide presentasi "${presentation.title || 'Laporan SPJ'}" berhasil dibuat di Google Drive Anda!`);
    } catch (e: any) {
      setSlideError(e.message || 'Gagal membuat slide presentasi Google Slides.');
    } finally {
      setLoadingSlides(false);
    }
  };

  // Contacts
  const instansiList = [
    {
      instansi: 'Dinas Keuangan Daerah (BKAD / Bagian Keuangan)',
      kontak: 'Ibu Maria G. Goreti (Kabid Perbendaharaan)',
      email: 'bkad.nagekeo@gmail.com',
      telepon: '0812-3456-7890',
      peran: 'Validasi SPD, NPD, SPM & Penerbitan SP2D'
    },
    {
      instansi: 'Kantor Pajak Pratama / KP2KP Mbay',
      kontak: 'Bapak Albertus (Fungsional Pajak Daerah)',
      email: 'pajak.mbay@gmail.com',
      telepon: '0811-9876-5432',
      peran: 'Verifikasi Setoran PPN & PPh serta Kode Billing'
    },
    {
      instansi: 'Inspektorat Kabupaten Nagekeo',
      kontak: 'Tim Auditor Internal PUPR',
      email: 'inspektorat.nagekeo@gmail.com',
      telepon: '0813-2244-6688',
      peran: 'Audit Post-Factum & Kepatuhan Berkas SPJ'
    }
  ];

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link berhasil disalin ke clipboard!');
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION BANNER */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl p-6 text-white border border-indigo-900 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-extrabold text-amber-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800 uppercase tracking-widest">Google Workspace Integration</span>
            <h1 className="text-2xl font-black tracking-tight leading-none mt-1">SISTEM KOORDINASI & RAPAT</h1>
            <p className="text-xs text-indigo-200/90 leading-relaxed max-w-xl">
              Hubungkan data SPJ, anggaran, dan pajak Anda secara langsung ke Google Calendar, Google Meet, dan Google Slides untuk mempermudah koordinasi dengan bagian keuangan dan perpajakan.
            </p>
          </div>
          
          <div className="shrink-0">
            {token ? (
              <div className="p-3 bg-indigo-900/40 border border-indigo-800 rounded-xl space-y-2 text-center">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{user?.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 bg-rose-700/80 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  Putus Akses Google
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Lock className="w-4 h-4 text-slate-950" /> Hubungkan Akun Google
              </button>
            )}
          </div>
        </div>
      </div>

      {token ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: NAVIGATION & SUBCONTENT */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Nav tabs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center gap-2 shadow-xs">
              <button
                onClick={() => setActiveSubTab('meet')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeSubTab === 'meet'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Video className="w-4 h-4" /> Jadwalkan Rapat Google Meet
              </button>
              <button
                onClick={() => setActiveSubTab('slides')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeSubTab === 'slides'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Presentation className="w-4 h-4" /> Generator Slide Presentasi
              </button>
            </div>

            {/* TAB CONTENT: GOOGLE MEET */}
            {activeSubTab === 'meet' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-600" /> Agenda Koordinasi & Google Meet
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Buat jadwal rapat resmi ke Google Calendar dan lampirkan link Google Meet secara instan.</p>
                </div>

                {meetSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-xs">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Rapat Berhasil Dijadwalkan!</p>
                      <p>{meetSuccess}</p>
                    </div>
                  </div>
                )}

                {meetError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Gagal Membuat Rapat</p>
                      <p className="mt-0.5">{meetError}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Form fields */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Judul Rapat</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Contoh: Rapat Evaluasi SPJ Triwulan I"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Deskripsi / Agenda</label>
                      <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        rows={3}
                        placeholder="Agenda rapat koordinasi..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-purple-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tanggal Rapat</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="date"
                            value={meetDate}
                            onChange={(e) => setMeetDate(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-purple-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Waktu Mulai (WITA)</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="time"
                            value={meetTime}
                            onChange={(e) => setMeetTime(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-purple-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invitations List */}
                  <div className="space-y-4 bg-slate-50/50 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Daftar Undangan (Email)</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{emails.length} Diundang</span>
                      </div>

                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {emails.map((email, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-100 rounded-xl">
                            <span className="text-xs font-mono text-slate-700 truncate">{email}</span>
                            <button
                              onClick={() => handleRemoveEmail(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {emails.length === 0 && (
                          <p className="text-[11px] text-slate-400 text-center italic py-4">Belum ada email undangan yang ditambahkan.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-150">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Undang email dinas / keuangan..."
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                        />
                        <button
                          onClick={handleAddEmail}
                          className="px-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400">Tekan tombol plus untuk mengundang bagian keuangan atau kantor pajak.</p>
                    </div>

                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={handleCreateMeet}
                    disabled={loadingMeet}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loadingMeet ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menjadwalkan Rapat...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 text-white" /> Buat Rapat & Google Meet Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: GOOGLE SLIDES */}
            {activeSubTab === 'slides' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Presentation className="w-5 h-5 text-purple-600" /> Google Slides Presenter Generator
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Eksportir data internal (Alokasi Rekening, Bukti Berkas SPJ, Pajak) ke dalam slide presentasi profesional di Google Drive Anda.</p>
                </div>

                {slideSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-emerald-800 text-xs">
                    <div className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Laporan Slide Presentasi Berhasil Dibuat!</p>
                        <p>{slideSuccess}</p>
                      </div>
                    </div>
                    {slideLink && (
                      <div className="flex items-center gap-2 pt-2 border-t border-emerald-150">
                        <a
                          href={slideLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Presentation className="w-3.5 h-3.5 text-white" /> Buka di Google Slides <ExternalLink className="w-3 h-3 text-white" />
                        </a>
                        <button
                          onClick={() => handleCopyLink(slideLink)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border border-slate-200"
                        >
                          <Copy className="w-3.5 h-3.5" /> Salin Link Slide
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {slideError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Gagal Membuat Slide</p>
                      <p className="mt-0.5">{slideError}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-4">
                  <h3 className="text-xs font-extrabold text-purple-950 uppercase tracking-wider">Opsi Informasi & Struktur Slide</h3>
                  
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between p-3 bg-white border border-purple-100/60 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">Slide 1: Slide Judul & Pembuka</p>
                        <p className="text-[10px] text-slate-500">Judul laporan pertanggungjawaban dinas PUPR Nagekeo 2026.</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold uppercase">Selalu Aktif</span>
                    </div>

                    <label className="flex items-center justify-between p-3 bg-white border border-purple-100/60 rounded-xl cursor-pointer hover:bg-slate-50/40">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">Slide 2: Ringkasan & Realisasi Pagu Anggaran</p>
                        <p className="text-[10px] text-slate-500">Menyertakan rincian sisa alokasi pagu anggaran per kode rekening.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeBudget}
                        onChange={(e) => setIncludeBudget(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-white border border-purple-100/60 rounded-xl cursor-pointer hover:bg-slate-50/40">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">Slide 3: Arsip & Kelengkapan Dokumen SPJ</p>
                        <p className="text-[10px] text-slate-500">Mencantumkan daftar 5 dokumen pengajuan terakhir.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeDocs}
                        onChange={(e) => setIncludeDocs(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-white border border-purple-100/60 rounded-xl cursor-pointer hover:bg-slate-50/40">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">Slide 4: Distribusi & Setoran Pajak Belanja</p>
                        <p className="text-[10px] text-slate-500">Menyertakan rincian pemotongan PPN, PPh, dan Pajak Galian C.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeTaxes}
                        onChange={(e) => setIncludeTaxes(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={handleGenerateSlides}
                    disabled={loadingSlides}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loadingSlides ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Membuat Slide di Google Drive...
                      </>
                    ) : (
                      <>
                        <Presentation className="w-4 h-4 text-white" /> Buat & Ekspor Slide Presentasi
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: RECENT MEETINGS & INSTANSI CONTACTS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Upcoming Meetings */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                <Calendar className="w-4 h-4 text-purple-600" /> Agenda Rapat Koordinasi
              </h3>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {rapatList.map((rapat) => (
                  <div key={rapat.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                    <div>
                      <p className="font-bold text-slate-800 text-[11px] leading-snug">{rapat.summary}</p>
                      <p className="text-[9px] font-mono font-semibold text-purple-600 mt-0.5">
                        {new Date(rapat.start).toLocaleString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WITA
                      </p>
                    </div>
                    {rapat.description && (
                      <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{rapat.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <a
                        href={rapat.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-extrabold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Video className="w-3 h-3 text-white" /> Gabung Meet
                      </a>
                      <button
                        onClick={() => handleCopyLink(rapat.meetLink)}
                        className="text-[9px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Salin Link
                      </button>
                    </div>
                  </div>
                ))}
                {rapatList.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center italic py-6">Belum ada agenda rapat Google Meet.</p>
                )}
              </div>
            </div>

            {/* Instansi Contacts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                <Users className="w-4 h-4 text-purple-600" /> Kontak Koordinasi Lintas Dinas
              </h3>

              <div className="space-y-3">
                {instansiList.map((ins, idx) => {
                  // Pre-filled mailto
                  const subject = encodeURIComponent('Koordinasi Berkas SPJ Dinas PUPR Nagekeo 2026');
                  const body = encodeURIComponent(`Halo ${ins.kontak},\n\nKami ingin berkoordinasi terkait kelengkapan berkas Surat Pertanggungjawaban (SPJ) dan verifikasi perpajakan untuk Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Nagekeo Tahun Anggaran 2026.\n\nBerikut rincian pagu anggaran dan berkas kami yang siap diselaraskan di sistem.\n\nMohon bantuannya untuk koordinasi lebih lanjut.\n\nHormat kami,\nDinas PUPR Nagekeo`);
                  const mailtoLink = `mailto:${ins.email}?subject=${subject}&body=${body}`;

                  return (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                      <div>
                        <h4 className="text-[11px] font-extrabold text-slate-800 leading-tight">{ins.instansi}</h4>
                        <p className="text-[9px] font-bold text-purple-600 uppercase tracking-wider mt-0.5">{ins.kontak}</p>
                      </div>
                      
                      <div className="text-[9px] text-slate-500 space-y-0.5 font-mono">
                        <p>Fungsi: {ins.peran}</p>
                        <p>Telp: {ins.telepon}</p>
                      </div>

                      <div className="flex gap-1.5 pt-1.5 border-t border-slate-200/60">
                        <a
                          href={mailtoLink}
                          className="flex-1 py-1 bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 text-[9px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          <Mail className="w-3 h-3 text-slate-500" /> Kirim Email
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* LOCKED AUTH PORTAL CARD */
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto text-center space-y-6 shadow-md my-8">
          <div className="w-16 h-16 bg-purple-50 border-4 border-purple-100 rounded-2xl flex items-center justify-center mx-auto text-purple-600 animate-bounce">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Koneksi Google Workspace Diperlukan</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Untuk mengagendakan rapat Google Meet secara resmi ke Google Calendar dan mengekspor data anggaran/SPJ ke dalam presentasi Google Slides, Anda harus mengotorisasi akses Google Workspace Anda terlebih dahulu.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-600 text-left space-y-2.5 border border-slate-150">
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">✓</span>
              <p><strong>Google Meet & Calendar:</strong> Membuat link ruang rapat resmi, mengirimkan undangan email ke instansi keuangan/pajak otomatis.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">✓</span>
              <p><strong>Google Slides Presenter:</strong> Membuat file presentasi baru dan menyalin rincian realisasi pagu keuangan dinas PUPR 2026 secara instan.</p>
            </div>
          </div>

          <button
            onClick={onLogin}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
          >
            <Lock className="w-4 h-4 text-white" /> Masuk & Hubungkan dengan Google Workspace
          </button>
        </div>
      )}

    </div>
  );
}
