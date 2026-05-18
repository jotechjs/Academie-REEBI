'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  FileText as FileTextIcon, 
  Download as DownloadIcon, 
  User, 
  LogOut, 
  Award as AwardIcon, 
  AlertCircle,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MessageSquare as MessageSquareIcon,
  Send as SendIcon
} from 'lucide-react';
import api from '@/services/api';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PresenceDate {
  date: string;
  status: 'P' | 'A';
}

interface RapportDate {
  date: string;
  status: string;
}

interface LearnerStats {
  presence: {
    totalPresence: number;
    totalAbsence: number;
    note: number;
    dates: PresenceDate[];
  };
  rapports: {
    note: number;
    dates: RapportDate[];
  };
  global: {
    moyenneCours: number;
    admisEvaluations: boolean;
    evalEcrite: number;
    evalOrale: number;
    observation: string;
    codeAttestation: string;
  };
}

export default function LearnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [data, setData] = useState<LearnerStats | null>(null);
  // CORRECTION BUG 2 : loading démarre à false — ne bloque plus si les données tardent
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDashboardData = async () => {
    setFetchError(false);
    setLoading(true);

    // Timeout de sécurité 15s : évite le spinner infini
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setFetchError(true);
    }, 15000);

    try {
      const response = await api.get('/learners/dashboard/stats');
      setData(response.data);
      setFetchError(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setFetchError(true);
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('reebi_user');
    const token = localStorage.getItem('reebi_token');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchDashboardData();
    } catch (e) {
      router.push('/login');
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('reebi_token');
    localStorage.removeItem('reebi_user');
    router.push('/login');
  };

  // Chargement en cours
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 font-medium tracking-tight">Chargement de votre espace personnel...</span>
      </div>
    );
  }

  // Erreur de chargement — fallback avec retry
  if (fetchError && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 text-center px-4">
        <div className="p-4 bg-red-50 rounded-full">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5C3.302 18.333 4.264 20 5.804 20z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Impossible de charger vos données</h3>
        <p className="text-slate-500 text-sm max-w-xs">Le serveur met du temps à répondre. Veuillez réessayer.</p>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Premium Header - Mobile Responsive */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Image 
              src="/logo-REEBI.png" 
              alt="REEBI Logo" 
              width={120}
              height={120}
              className="h-14 md:h-20 w-auto object-contain" 
              priority
            />
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-3 md:px-4 py-2 rounded-2xl border border-slate-100 text-sm">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-slate-200">
                <User size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-bold text-slate-800 leading-none">{user?.lastName} {user?.firstName}</span>
                <span className="text-[10px] font-medium text-slate-500">Promotion 4</span>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition-all p-2.5 md:p-3 rounded-2xl hover:bg-red-50 group min-h-touch min-w-touch">
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 mt-6 md:mt-12">
        <div className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Tableau de Bord</h2>
          <p className="text-lg text-slate-500 font-medium">Bienvenue dans votre espace de suivi académique.</p>
        </div>

        {/* SECTION 1: CALENDRIER DE PRÉSENCE */}
        <section className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 md:mb-10 overflow-hidden relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 md:mb-12 gap-4 md:gap-8">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="w-12 md:w-14 h-12 md:h-14 bg-green-50 rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-green-600 shadow-inner">
                <CalendarIcon className="w-6 md:w-7 h-6 md:h-7" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">Régularité Présence</h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium">Séances plénières académiques</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-start gap-2 md:gap-4">
              <div className="bg-green-50 border border-green-100 px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center text-xs md:text-sm min-w-[70px] md:min-w-auto">
                <span className="text-[8px] md:text-xs font-bold text-green-600 uppercase mb-0.5 md:mb-1">Présence</span>
                <span className="text-base md:text-xl font-black text-green-700">{data.presence.totalPresence}%</span>
              </div>
              <div className="bg-red-50 border border-red-100 px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center text-xs md:text-sm min-w-[70px] md:min-w-auto">
                <span className="text-[8px] md:text-xs font-bold text-red-600 uppercase mb-0.5 md:mb-1">Absences</span>
                <span className="text-base md:text-xl font-black text-red-700">{data.presence.totalAbsence}j</span>
              </div>
              <div className="bg-slate-900 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center text-white shadow-lg text-xs md:text-sm min-w-[70px] md:min-w-auto">
                <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase mb-0.5 md:mb-1">Note</span>
                <span className="text-base md:text-xl font-black">{data.presence.note}/20</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid - Scrollable on mobile */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 md:-mx-10 px-4 md:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-10 min-w-[280px] sm:min-w-auto">
              {['02', '03', '04'].map((month) => (
                <div key={month} className="bg-slate-50/50 rounded-2xl md:rounded-3xl p-3 md:p-8 border border-slate-100/50 hover:bg-slate-50 transition-colors">
                  <h3 className="text-center font-black text-slate-800 mb-3 md:mb-6 text-sm md:text-lg tracking-tight capitalize">
                    {month === '02' ? 'Février' : month === '03' ? 'Mars' : 'Avril'} 2024
                  </h3>
                  <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-3">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                      <div key={`${day}-${idx}`} className="text-[8px] md:text-[10px] font-black text-slate-400 text-center uppercase">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                      const dateStr = `${day < 10 ? '0' + day : day}/${month}`;
                      const isPlenary = data.presence.dates.find((d) => d.date === dateStr);
                      const isRange = dateStr === '24/04' || dateStr === '25/04' || dateStr === '26/04';
                      const plenaryMatch = isPlenary || (month === '04' && isRange && data.presence.dates.find((d) => d.date === '24-26/04'));

                      if (month === '02' && day > 29) return null;
                      if (month === '04' && day > 30) return null;

                      return (
                        <div 
                          key={day} 
                          className={`aspect-square rounded-md md:rounded-xl flex items-center justify-center text-[10px] md:text-xs font-bold transition-all relative group/day
                            ${plenaryMatch 
                              ? (plenaryMatch.status === 'P' ? 'bg-green-500 text-white shadow-lg shadow-green-100 scale-105 md:scale-110 z-10' : 'bg-red-400 text-white shadow-lg shadow-red-100 scale-105 md:scale-110 z-10') 
                              : 'text-slate-400 hover:bg-slate-200 cursor-default'
                            }`}
                        >
                          {day}
                          {plenaryMatch && (
                            <div className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 px-1.5 md:px-2 py-0.5 md:py-1 bg-slate-800 text-[8px] md:text-[10px] text-white rounded opacity-0 group-hover/day:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                              {plenaryMatch.status === 'P' ? 'Présent' : 'Absent'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </section>

          {/* SECTION 2: RAPPORTS SÉQUENCES (Table Scrollable) */}
        <section className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="w-12 md:w-14 h-12 md:h-14 bg-blue-50 rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-blue-600 shadow-inner">
                <FileTextIcon className="w-6 md:w-7 h-6 md:h-7" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">Rapports & Séquences</h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium">Suivi des livrables académiques</p>
              </div>
            </div>
            <div className="bg-blue-600 px-4 md:px-6 py-2 md:py-3 rounded-2xl text-white font-black shadow-lg shadow-blue-100 text-sm md:text-base min-h-touch min-w-touch">
              Note: {data.rapports.note}/20
            </div>
          </div>

          {/* Scrollable cards - horizontal on desktop */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 md:-mx-10 px-4 md:px-10">
            <div className="flex gap-3 md:gap-5 min-w-[240px] md:min-w-fit">
              {data.rapports.dates.map((rapport, idx) => (
                <div key={idx} className="flex-none w-48 md:w-auto md:flex-1 bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all group/card border-b-4 border-b-transparent hover:border-b-blue-500 min-h-touch">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider">SÉQUENCE {idx + 1}</span>
                    <div className={`w-2.5 md:w-3 h-2.5 md:h-3 rounded-full ${rapport.status === 'Rendu' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-400'}`}></div>
                  </div>
                  <div className="text-base md:text-xl font-black text-slate-800 mb-1">{rapport.date}</div>
                  <div className="text-xs font-bold text-slate-500 mb-4 md:mb-6 flex items-center gap-1">
                    <CheckCircle2 size={12} className={rapport.status === 'Rendu' ? 'text-green-500' : 'text-slate-300'} />
                    {rapport.status}
                  </div>
                  <button className="w-full py-2.5 md:py-3 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-xs font-black text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all transform active:scale-95 min-h-touch">
                    Consulter
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: RÉCAPITULATIF GLOBAL */}
        <section className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 md:mb-10">
          <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight mb-4 md:mb-10">Récapitulatif de la Promotion</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
            {[
              { label: 'Moyenne Cours', value: `${data.global.moyenneCours}/20`, icon: AwardIcon, color: 'blue' },
              { label: 'Admis Évals', value: data.global.admisEvaluations ? 'OUI' : 'NON', icon: CheckCircle2, color: data.global.admisEvaluations ? 'green' : 'red' },
              { label: 'Éval. Écrite', value: `${data.global.evalEcrite}/20`, icon: FileTextIcon, color: 'slate' },
              { label: 'Éval. Orale', value: `${data.global.evalOrale}/20`, icon: User, color: 'slate' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50/80 rounded-xl md:rounded-3xl p-3 md:p-8 border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl transition-all min-h-touch">
                <div className={`w-8 md:w-12 h-8 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center mb-1.5 md:mb-4 transition-transform group-hover:scale-110 ${
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                  stat.color === 'green' ? 'bg-green-50 text-green-600' : 
                  stat.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  <stat.icon className="w-4 md:w-6 h-4 md:h-6" />
                </div>
                <p className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-wider md:tracking-widest mb-0.5 md:mb-1">{stat.label}</p>
                <div className="text-base md:text-2xl font-black text-slate-800">{stat.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: RÉSULTAT DE L'ACADÉMIE */}
        <ResultSection global={data.global} learner={user!} />

        {/* SECTION 5: PARTAGER VOTRE EXPÉRIENCE */}
        <ExperienceSection />

        {/* Support & Contact */}
        <div className="mt-20 text-center">
          <p className="text-slate-400 text-sm font-medium">Un problème avec vos données ?</p>
          <button className="text-blue-600 font-bold hover:underline">Contacter l'administration REEBI</button>
        </div>
      </main>
    </div>
  );
}

interface ResultSectionProps {
  global: LearnerStats['global'];
  learner: UserData;
}

function ResultSection({ global, learner }: ResultSectionProps) {
  const [inputCode, setInputCode] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [iframeScale, setIframeScale] = useState(1);

  // Debug supprimé en production
  const normalizedObservation = (global.observation || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const isCertified = normalizedObservation === 'certifie';
  const isNotCertified = normalizedObservation === 'non certifie';

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const certWidth = 1122;
        const padding = 32; // Account for container padding
        const availableWidth = containerWidth - padding;
        const newScale = Math.min(availableWidth / certWidth, 1);
        setIframeScale(newScale);
      }
    };

    if (isValidated) {
      // Run immediately and after a short delay for DOM settle
      updateScale();
      const timer = setTimeout(updateScale, 100);
      window.addEventListener('resize', updateScale);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateScale);
      };
    }
  }, [isValidated]);

  const handleValidate = async () => {
    if (inputCode === global.codeAttestation) {
      try {
        const response = await fetch('/api/certificate/template');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        // Render the template
        let html = data.template;

        // Inject styles directly instead of external link
        const fullStyles = `
          <style>
            ${data.styles}
            @page {
              size: A4 landscape;
              margin: 0;
            }
            html, body {
              width: 1122px;
              height: 794px;
              margin: 0;
              padding: 0;
              overflow: visible;
              background-color: #ffffff !important;
            }
            .certificate {
              width: 1122px;
              height: 794px;
              min-width: 1122px;
              min-height: 794px;
              overflow: visible;
              background-color: #ffffff !important;
            }
          </style>
        `;
        html = html.replace('</head>', `${fullStyles}</head>`);
        html = html.replace('<link rel="stylesheet" href="./styles.css" />', '');
        
        // Replace placeholders
        const replacements: Record<string, string> = {
          '{{firstName}}': learner.firstName,
          '{{lastName}}': learner.lastName,
          '{{moyenne}}': global.moyenneCours.toString(),
          '{{codeUnique}}': global.codeAttestation,
          '{{issueDate}}': new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          './assets/logo-reebi.png': data.logo,
          '{{signatureImage}}': data.signature
        };

        Object.keys(replacements).forEach(key => {
          const value = replacements[key];
          html = html.split(key).join(value);
        });

        setRenderedHtml(html);
        setIsValidated(true);
        setError(false);
      } catch (err) {
        console.error('Failed to load certificate template:', err);
        alert('Erreur lors du chargement du template de certificat.');
      }
    } else {
      setError(true);
      setIsValidated(false);
    }
  };

  // Dynamically load html2pdf only when needed (fallback)
  const loadHtml2Pdf = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('No window'));
      // @ts-ignore
      if ((window as any).html2pdf) return resolve((window as any).html2pdf);

      const existing = document.getElementById('html2pdf-script');
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any).html2pdf));
        existing.addEventListener('error', () => reject(new Error('Failed to load html2pdf')));
        return;
      }

      const script = document.createElement('script');
      script.id = 'html2pdf-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = () => reject(new Error('Failed to load html2pdf'));
      document.body.appendChild(script);
    });
  };

  const [pdfLoadingMsg, setPdfLoadingMsg] = useState('');
  const pdfMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDownloadPDF = async () => {
    if (!renderedHtml) return;

    setIsExporting(true);
    setPdfLoadingMsg('');

    if (pdfMsgTimerRef.current) clearTimeout(pdfMsgTimerRef.current);
    pdfMsgTimerRef.current = setTimeout(() => {
      setPdfLoadingMsg('Le serveur prépare votre PDF...');
    }, 5000);

    try {
      const token = localStorage.getItem('reebi_token');
      
      const response = await fetch('/api/learners/certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          moyenneCours: global.moyenneCours,
          codeAttestation: global.codeAttestation,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      
      if (response.ok && contentType.includes('application/pdf')) {
        const pdfBlob = await response.blob();
        
        if (pdfBlob.size >= 5000) {
          console.log('[PDF] Backend OK:', pdfBlob.size);
          const url = window.URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Attestation_REEBI_${learner.firstName}_${learner.lastName}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          setIsExporting(false);
          return;
        }
      }

      console.log('[PDF] Using html2canvas + jsPDF direct fallback');
      
      // Load libraries dynamically
      await new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('No window'));
        
        // @ts-ignore
        if (window.jspdf && window.html2canvas) {
          resolve();
          return;
        }
        
        const jsPdfScript = document.createElement('script');
        jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jsPdfScript.async = true;
        jsPdfScript.onload = () => {
          const html2canvasScript = document.createElement('script');
          html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          html2canvasScript.async = true;
          html2canvasScript.onload = () => resolve();
          html2canvasScript.onerror = () => reject(new Error('Failed to load html2canvas'));
          document.body.appendChild(html2canvasScript);
        };
        jsPdfScript.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.body.appendChild(jsPdfScript);
      });

      // Create container with proper visibility
      const container = document.createElement('div');
      container.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: 1122px;
        height: 794px;
        background: white;
        overflow: hidden;
        z-index: 999999;
      `;
      container.innerHTML = renderedHtml;
      document.body.appendChild(container);

      // Wait for render
      await new Promise(r => setTimeout(r, 1000));

      // @ts-ignore
      const html2canvas = window.html2canvas;
      // @ts-ignore
      const { jsPDF } = window.jspdf;

      if (!html2canvas || !jsPDF) {
        throw new Error('Libraries not loaded');
      }

      console.log('[PDF] Capturing canvas...');
      
      const canvas = await html2canvas(container, {
        width: 1122,
        height: 794,
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
      });

      console.log('[PDF] Canvas captured, size:', canvas.width, 'x', canvas.height);

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1122, 794],
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 1122, 794);
      
      const pdfOutput = pdf.output('blob');
      console.log('[PDF] Generated, size:', pdfOutput.size);

      // Download
      const url = window.URL.createObjectURL(pdfOutput);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Attestation_REEBI_${learner.firstName}_${learner.lastName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Cleanup
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      const msg = err?.message || 'Une erreur est survenue lors de l\'exportation du PDF.';
      alert(msg);
    } finally {
      setIsExporting(false);
      if (pdfMsgTimerRef.current) clearTimeout(pdfMsgTimerRef.current);
      setPdfLoadingMsg('');
    }
  };

if (isNotCertified) {
    return (
      <section className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-10">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Résultat de l'académie</h2>
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-center">
          <p className="text-lg text-slate-600 font-medium">
            Nous vous encourageons à poursuivre ce parcours de discipolat avec grande soif, discipline, et détermination.
          </p>
        </div>
      </section>
    );
  }

  if (!isCertified) {
    return (
      <section className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-10">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Résultat de l'académie</h2>
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-center">
          <p className="text-lg text-slate-600 font-medium">
            Nous vous encourageons à poursuivre ce parcours de discipolat avec grande soif, discipline, et détermination.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-10 overflow-hidden">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Résultat de l’académie</h2>
      
      {!isValidated ? (
        <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
              <AwardIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-lg text-slate-800 font-bold leading-tight mb-1">
                Félicitations pour avoir terminé brillamment votre parcours de discipolat.
              </p>
              <p className="text-blue-600 text-sm font-medium">
                Entrer le code reçu après votre paiement pour accéder à votre attestation !
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setError(false);
              }}
              placeholder="Collez votre code ici"
              className={`flex-1 px-6 py-4 bg-white border ${error ? 'border-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-bold transition-all`}
            />
            <button 
              onClick={handleValidate}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              Valider
            </button>
          </div>
          {error && <p className="text-red-500 text-sm font-bold mt-3 flex items-center gap-2 animate-bounce">
            <AlertCircle size={14} />
            Code incorrect, veuillez réessayer
          </p>}
        </div>
      ) : (
<div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Certificate Container - Responsive scaling */}
          <div
            ref={containerRef}
            className="w-full overflow-hidden bg-slate-100 p-2 md:p-4 rounded-xl md:rounded-3xl flex justify-center"
            style={{ minHeight: `${Math.max(794 * iframeScale + 32, 300)}px` }}
          >
             <div
                ref={certificateRef}
                className="shadow-2xl bg-white"
                style={{
                  width: '1122px',
                  height: '794px',
                  transform: `scale(${iframeScale})`,
                  transformOrigin: 'top center',
                }}
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
          </div>
          
          <div className="flex justify-center px-4">
            <button 
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-[2rem] font-black text-sm md:text-lg hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200 transform active:scale-95 group disabled:opacity-50 min-h-touch"
            >
              {isExporting ? (
                <>
                  <div className="w-5 md:w-6 h-5 md:h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  {pdfLoadingMsg && <span className="text-xs font-medium ml-2 opacity-80">{pdfLoadingMsg}</span>}
                </>
              ) : (
                <>
                  <DownloadIcon size={24} className="group-hover:-translate-y-1 transition-transform" />
                  <span className="hidden sm:inline">Télécharger mon attestation (PDF)</span>
                  <span className="sm:hidden">Télécharger PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ExperienceSection() {
  const [form, setForm] = useState({
    answer1: '',
    answer2: '',
    answer3: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/experiences', form);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Failed to submit experience', error);
      alert('Une erreur est survenue lors de l\'envoi de votre témoignage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="bg-green-50 rounded-[2.5rem] p-12 shadow-xl shadow-green-100 border border-green-100 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-lg shadow-green-200">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Merci pour votre partage !</h2>
        <p className="text-slate-600 font-medium text-lg max-w-md mx-auto leading-relaxed">
          Votre témoignage a été bien reçu par l'équipe REEBI. Que Dieu vous bénisse !
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
      <div className="flex items-center gap-3 md:gap-5 mb-6 md:mb-10">
        <div className="w-10 md:w-14 h-10 md:h-14 bg-indigo-50 rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-indigo-600 shadow-inner">
          <MessageSquareIcon className="w-5 md:w-7 h-5 md:h-7" />
        </div>
        <div>
          <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">Partager votre expérience</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Votre témoignage est précieux pour nous.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-8">
        <div className="space-y-2 md:space-y-3">
          <label className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-wider block">
            1. Quel est ton témoignage durant ce parcours ?
          </label>
          <textarea
            required
            value={form.answer1}
            onChange={(e) => setForm({ ...form, answer1: e.target.value })}
            className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-[2rem] text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all min-h-[120px] md:min-h-[150px] resize-none text-sm md:text-base"
            placeholder="Partagez avec nous les moments forts..."
          />
        </div>

        <div className="space-y-2 md:space-y-3">
          <label className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-wider block">
            2. Comment était ta connexion avec ton Encadreur ?
          </label>
          <textarea
            required
            value={form.answer2}
            onChange={(e) => setForm({ ...form, answer2: e.target.value })}
            className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-[2rem] text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all min-h-[120px] md:min-h-[150px] resize-none text-sm md:text-base"
            placeholder="Comment s'est passée votre collaboration ?"
          />
        </div>

        <div className="space-y-2 md:space-y-3">
          <label className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-wider block">
            3. Suggestions pour améliorer les prochaines académies ?
          </label>
          <textarea
            required
            value={form.answer3}
            onChange={(e) => setForm({ ...form, answer3: e.target.value })}
            className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-[2rem] text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all min-h-[120px] md:min-h-[150px] resize-none text-sm md:text-base"
            placeholder="Vos conseils pour nous aider à grandir..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 md:py-5 bg-indigo-600 text-white rounded-xl md:rounded-[2rem] font-black text-sm md:text-lg flex items-center justify-center gap-2 md:gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] disabled:opacity-50 min-h-touch"
        >
          {isSubmitting ? (
            <div className="w-5 md:w-6 h-5 md:h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <SendIcon size={20} />
              <span className="hidden sm:inline">Soumettre mon expérience</span>
              <span className="sm:hidden">Soumettre</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
