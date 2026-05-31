import React, { useState, useEffect, useRef } from 'react';
import { Shield, Loader2, AlertTriangle, Fingerprint, CheckCircle2, Lock, UploadCloud, Link as LinkIcon, Share2, Eye, ShieldAlert, Crosshair, HelpCircle, FileImage, X, Search, Sun, Moon, Trash2, BookOpen, Briefcase, Heart, AlertCircle, Copy, Plus, Camera, Image as ImageIcon, Menu } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { ReportView } from './components/ReportView';
import { CommunityView } from './components/CommunityView';
import { RecoveryView } from './components/RecoveryView';
import { DashboardView } from './components/DashboardView';
import { UserManagementView } from './components/UserManagementView';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const loadingTexts = [
  "Mengekstrak teks & gambar...",
  "Mendeteksi taktik manipulasi psikologis...",
  "Memprofiling gaya bahasa & taktik manipulasi...",
  "Mengevaluasi tautan dan permintaan data...",
  "Menyusun laporan skor keamanan...",
];

type AnalysisResult = {
  risk_score: number;
  risk_level: "BAHAYA" | "WASPADA" | "AMAN";
  assurance_message: string;
  tactics: {
    quote: string;
    name: string;
    explanation: string;
  }[];
  extracted_entities?: {
    label: string;
    value: string;
    advice: string;
  }[];
  action_steps: string[];
  incident_report_template: string;
};

// Circular gauge component
function RiskGauge({ score, level }: { score: number, level: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  let color = "text-emerald-500";
  if (score > 30) color = "text-amber-500";
  if (score > 70) color = "text-rose-500";

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-700" />
        <motion.circle 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" 
          strokeDasharray={circumference} className={color} strokeLinecap="round" 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-display font-black text-slate-900 dark:text-white">{score}</span>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{level}</span>
      </div>
    </div>
  );
}

const SAMPLE_CASES = [
  {
    title: "APK Undangan Nikah",
    desc: "Penipu mengirim file berekstensi .apk berkedok undangan pernikahan.",
    text: "Yth. Bpk/Ibu, Berikut kami sampaikan Undangan Pernikahan kami. Silakan buka file APK berikut untuk melihat detail lokasi. Mohon kehadirannya."
  },
  {
    title: "Ancaman Blokir Bank",
    desc: "Mengaku dari CS Bank dan mengancam pemblokiran karena tagihan fiktif.",
    text: "INFO RESMI: Rekening Anda akan diblokir dalam 30 menit karena tunggakan cicilan. Segera klik link ini untuk pembatalan dan verifikasi OTP."
  },
  {
    title: "Teman Pinjam Uang",
    desc: "Akun teman yang meminjam uang dengan skenario darurat.",
    text: "Bro, lagi sibuk gak? Aku lagi di RS nih darurat banget dompet ketinggalan. Bisa tolong transferin 2jt ke rek BNI 0987654321 a/n Budi? Besok pagi langsung aku ganti."
  }
];

const PROMPT_TEMPLATES = [
  "Tolong analisa pesan ini, apakah ada indikasi penipuan atau manipulasi: [PESAN/LINK]",
  "Seseorang mengirimkan ini kepada saya dan meminta data/uang, apakah ini aman? [PESAN]",
  "Saya ditawari komisi besar dengan cara kerja seperti ini, tolong evaluasi: [DETAIL_KERJA]",
  "Tolong cek apakah email tagihan/peringatan dari perusahaan ini resmi atau phishing: [EMAIL]"
];

const ANALYSIS_MODES = [
  { id: 'auto', label: 'Deteksi Otomatis', icon: Search },
  { id: 'apk', label: 'Modus Tautan/APK', icon: LinkIcon },
  { id: 'job', label: 'Lowongan Kerja', icon: Briefcase },
  { id: 'romance', label: 'Asmara & Investasi', icon: Heart },
  { id: 'emergency', label: 'Darurat (Minta Uang)', icon: AlertCircle },
];

export default function App() {
  const [message, setMessage] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('auto');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('scan');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Load from local storage on mount
  useEffect(() => {
    const savedResult = localStorage.getItem("tameng_last_result");
    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (e) {
        console.error("Failed to parse saved result", e);
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingTexts.length);
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSetSample = (text: string) => {
    setMessage(text);
    removeImage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeImage = () => {
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const clearHistory = () => {
    setResult(null);
    localStorage.removeItem("tameng_last_result");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check size (max 5MB for UX)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar terlalu besar. Maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeMessage = async () => {
    if (!message.trim() && !imageBase64) {
      setError("Mohon masukkan teks atau unggah screenshot pesan.");
      return;
    }
    
    setLoading(true);
    setError(null);
    // Kita tidak setResult(null) di awal agar tidak hilang loading kalau ada error

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, imageBase64, analysisMode }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat menganalisis.');
      }

      setResult(data.result);
      localStorage.setItem("tameng_last_result", JSON.stringify(data.result));
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server. Pastikan Anda terkoneksi internet.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.incident_report_template);
      alert("Teks peringatan berhasil disalin! Anda dapat membagikannya secara privat kepada rekan/keluarga.");
    }
  };

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.tab) {
        setActiveTab(customEvent.detail.tab);
      }
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  return (
    <div className="min-h-screen flex text-slate-900 dark:text-slate-200 font-sans selection:bg-indigo-200 dark:selection:bg-indigo-900 bg-white dark:bg-slate-950 transition-colors">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen relative w-full">
      {/* Navbar Modern */}
      <nav className="sticky top-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 z-30 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group relative">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-1.5 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] lg:hidden">
              <Crosshair className="w-5 h-5" />
            </div>
            <div className="flex flex-col lg:hidden">
              <span className="font-display font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 tracking-[0.1em]">TAMENG</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
               onClick={() => setShowGuide(true)}
               className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-md transition-colors"
               title="Panduan Penggunaan"
             >
               <BookOpen className="w-3 h-3" />
               <span className="hidden sm:inline">Panduan</span>
             </button>
            <button
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
               title="Toggle Theme"
             >
               {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
			{result && activeTab === 'scan' && (
			  <button onClick={clearHistory} className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-md transition-colors">
				<Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Hapus Riwayat</span>
			  </button>
			)}

		  </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full">
        {activeTab === 'report' && <ReportView />}
        {activeTab === 'community' && <CommunityView />}
        {activeTab === 'recovery' && <RecoveryView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'users' && <UserManagementView />}
        
        {activeTab === 'scan' && (
           <div className="space-y-12">
        {/* Header/Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-6 max-w-4xl mx-auto mb-12 relative"
        >
          {/* Decorative background blur element */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full sm:w-[120%] h-full bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-emerald-500/10 blur-3xl -z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest mx-auto mb-4 shadow-sm backdrop-blur-md">
             <ShieldAlert className="w-4 h-4 text-indigo-500" />
             <span className="opacity-90">Sistem Intelijen Taktik Anti-Manipulasi & Ekstraksi Narasi Gelap</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-black text-slate-800 dark:text-white tracking-tight leading-[1.05] transition-colors relative">
            Validasi Keamanan
            <span className="block mt-2 relative">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-900 dark:from-white dark:to-slate-400">Komunikasi Digital.</span>
            </span>
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto transition-colors mt-8">
            Evaluasi kredibilitas pesan, tautan, atau dokumen visual secara real-time. Mesin intelijen TAMENG menganalisis pola manipulasi struktural dan linguistik untuk mencegah risiko ancaman siber.
          </p>
          
          {/* Trust badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-70">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
               <Shield className="w-4 h-4 text-emerald-500" /> Pemindaian Aman
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
               <Search className="w-4 h-4 text-indigo-500" /> Bedah Taktik Scammer
            </div>
             <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
               <Eye className="w-4 h-4 text-sky-500" /> 100% Privat
            </div>
          </div>
        </motion.section>

        {/* Unified Multimodal Input Area */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200 dark:shadow-indigo-900/20 border border-slate-200 dark:border-slate-700 overflow-hidden relative p-2 transition-colors"
        >
          <div className="bg-white/80 dark:bg-slate-800/50 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/50">
            <div className="flex flex-col gap-4">
               <div className="flex flex-row justify-between items-end">
                 <label htmlFor="message-input" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                   <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Area Pemindaian Aman
                 </label>
               </div>
               
               {/* Analysis Mode Selector */}
               <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
                    Fokus Pemindaian Lanjutan (Opsional):
                  </p>
                  <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
                    {ANALYSIS_MODES.map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setAnalysisMode(mode.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                          analysisMode === mode.id 
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                            : "bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                      >
                        <mode.icon className="w-4 h-4" />
                        {mode.label}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="relative mt-2">
                 <textarea
                   id="message-input"
                   className={cn(
                     "w-full p-5 sm:p-6 text-lg sm:text-xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-600 focus:border-indigo-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-medium text-slate-800 dark:text-slate-200 shadow-inner",
                     imageBase64 ? "pb-24 h-48" : "h-40 sm:h-48"
                   )}
                   placeholder="Ketik, paste teks, atau upload screenshot peringatan/chat..."
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   disabled={loading}
                 ></textarea>

                 {/* Image Preview / Upload Button */}
                 <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                   {imageBase64 ? (
                     <div className="relative group">
                       <img src={imageBase64} alt="Screenshot tercetak" className="h-16 w-16 object-cover rounded-xl border border-slate-300 dark:border-slate-600 shadow-md" />
                       <button onClick={removeImage} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-100 hover:bg-rose-600 transition-colors shadow-lg">
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   ) : (
                     <div>
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         ref={fileInputRef} 
                         onChange={(e) => { handleImageSelect(e); setShowUploadMenu(false); }}
                       />
                       <input 
                         type="file" 
                         accept="image/*"
                         capture="environment"
                         className="hidden" 
                         ref={cameraInputRef} 
                         onChange={(e) => { handleImageSelect(e); setShowUploadMenu(false); }}
                       />
                       <div className="relative">
                         <button 
                           onClick={() => setShowUploadMenu(!showUploadMenu)}
                           className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-all shadow-sm"
                         >
                           <Plus className="w-5 h-5" />
                         </button>
                         
                         <AnimatePresence>
                           {showUploadMenu && (
                             <motion.div 
                               initial={{ opacity: 0, y: 10, scale: 0.95 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               exit={{ opacity: 0, y: 10, scale: 0.95 }}
                               className="absolute bottom-12 left-0 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20"
                             >
                               <button 
                                 onClick={() => cameraInputRef.current?.click()}
                                 className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-100 dark:border-slate-700/50 font-medium text-sm"
                               >
                                 <Camera className="w-4 h-4 text-indigo-500" />
                                 <span>Kamera</span>
                               </button>
                               <button 
                                 onClick={() => fileInputRef.current?.click()}
                                 className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-medium text-sm"
                               >
                                 <ImageIcon className="w-4 h-4 text-emerald-500" />
                                 <span>Galeri</span>
                               </button>
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
            </div>
            
            <button
              onClick={analyzeMessage}
              disabled={(!message.trim() && !imageBase64) || loading}
              className="mt-6 w-full relative overflow-hidden group py-5 sm:py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:dark:bg-slate-800 disabled:text-slate-400 disabled:dark:text-slate-500 text-white font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.99] shadow-md border border-indigo-500/20 disabled:border-transparent"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={loadingStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-base sm:text-lg"
                    >
                      {loadingTexts[loadingStep]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <span className="text-base sm:text-lg tracking-wide">Pindai Potensi Penipuan</span>
                  <Fingerprint className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          </div>
        </motion.section>

        {/* Empty State / Sample Cases */}
        <AnimatePresence>
          {!result && !loading && !error && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="space-y-4 pt-4"
            >
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Contoh Kasus Hari Ini</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SAMPLE_CASES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSetSample(sample.text)}
                    className="flex flex-col text-left bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 p-5 rounded-3xl transition-all duration-200 group"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{sample.title}</span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">{sample.desc}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-4">Template Prompt (Pilih Untuk Salin)</h3>
                <div className="flex flex-wrap gap-2 px-2">
                  {PROMPT_TEMPLATES.map((prompt, idx) => (
                    <button
                      key={`prompt-${idx}`}
                      onClick={() => {
                        handleSetSample(prompt);
                        navigator.clipboard.writeText(prompt);
                      }}
                      className="text-left text-xs bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-2 group"
                    >
                      <span className="truncate max-w-[280px] sm:max-w-md">{prompt}</span>
                      <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Error Feedback */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" />
                <p className="text-sm sm:text-base font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bento Grid Results Area */}
        <AnimatePresence>
          {result && !loading && (
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Score Tile */}
                <div className={cn(
                  "col-span-1 border rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden",
                  result.risk_score > 70 ? "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50" : 
                  result.risk_score > 30 ? "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50"
                )}>
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4 z-10">Tingkat Risiko</h3>
                  <RiskGauge score={result.risk_score} level={result.risk_level} />
                  
                  <div className="w-full mt-6 space-y-2 z-10 px-2 pb-2 border-b border-black/5 dark:border-white/5">
                    <div className="flex justify-between text-xs font-bold font-mono">
                      <span className="text-rose-600 dark:text-rose-400">{result.risk_score}% Manipulasi</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{100 - result.risk_score}% Sah</span>
                    </div>
                    <div className="w-full h-1.5 bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.risk_score}%` }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        className="h-full bg-rose-500"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest mt-1">
                      <span>Probabilitas Ancaman</span>
                      <span>Kemungkinan Valid</span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300 z-10 leading-relaxed px-2">
                    {result.assurance_message}
                  </p>
                </div>

                {/* 2. Tactics Grid */}
                <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-700/50 p-6 sm:p-8 shadow-sm backdrop-blur-md">
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Crosshair className="w-4 h-4" /> Bedah Taktik Psikologis
                  </h3>
                  
                  {result.tactics.length > 0 ? (
                    <div className="space-y-4">
                      {result.tactics.map((tactic, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700">
                          <div className="flex gap-4 items-start">
                            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm dark:shadow-inner border border-slate-200 dark:border-slate-700 mt-1">
                              {idx % 2 === 0 ? <HelpCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> : <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-slate-200 mb-1">{tactic.name}</h4>
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 italic mb-3">"{tactic.quote}"</p>
                              <div className="w-8 h-px bg-slate-200 dark:bg-slate-600 mb-3"></div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{tactic.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 font-medium">
                      Tidak ada taktik manipulasi berbahaya yang terdeteksi.
                    </div>
                  )}
                </div>

                {/* 5. Extracted Entities */}
                {result.extracted_entities && result.extracted_entities.length > 0 && (
                  <div className="col-span-1 md:col-span-3 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/50 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-md">
                    <h3 className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Search className="w-4 h-4" /> Investigasi Lanjutan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.extracted_entities.map((entity, idx) => {
                         const isRekening = entity.label.toLowerCase().includes('rekening') || entity.label.toLowerCase().includes('bank');
                         
                         return (
                           <div key={idx} className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/50 shadow-sm dark:shadow-inner flex flex-col">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{entity.label}</span>
                             <div className="font-mono text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2 select-all">{entity.value}</div>
                             <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-100/50 dark:bg-indigo-900/40 p-2 rounded-xl mt-auto mb-4 border border-indigo-200/50 dark:border-indigo-800/50">
                                💡 Saran: {entity.advice}
                             </span>
                             <a 
                               href={isRekening ? "https://cekrekening.id/home" : `https://www.google.com/search?q=${entity.value}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 mt-auto text-center transition-colors block border border-indigo-400/20"
                             >
                               Cek Nomor Secara Manual
                             </a>
                           </div>
                         );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Next Steps */}
                <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm dark:shadow-xl backdrop-blur-md">
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Langkah Aman Selanjutnya
                  </h3>
                  <ul className="space-y-4">
                    {result.action_steps.map((step, idx) => (
                      <li key={idx} className="flex gap-4 items-start">
                        <div className="bg-slate-100 dark:bg-white/10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-white">
                          {idx + 1}
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Safe Warning Template */}
                <div className="col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col backdrop-blur-md">
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> Notifikasi Internal Aman
                  </h3>
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-4 mb-4 flex-grow border border-indigo-100 dark:border-indigo-900/50">
                    <p className="text-xs font-medium text-indigo-900 dark:text-indigo-300 leading-relaxed italic">
                      "{result.incident_report_template}"
                    </p>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors active:scale-95 border border-indigo-400/20"
                  >
                    Salin Teks Peringatan Aman
                  </button>
                </div>

              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowGuide(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Panduan & Fitur TAMENG</h2>
                  </div>
                  <button 
                    onClick={() => setShowGuide(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                       <ShieldAlert className="w-5 h-5 text-indigo-500" /> Analisis Multi-Modus & Template Prompt
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      Anda dapat memilih modus spesifik (seperti Tautan/APK, Lowongan Fiktif, Love Scam) lalu memasukkan teks atau mengunggah screenshot gambar percakapan. Jika bingung mulai dari mana, gunakan <b>Template Prompt</b> yang telah kami sediakan di bawah layar untuk kemudahan.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                       <Eye className="w-5 h-5 text-emerald-500" /> Transparansi Skor Risiko
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      Hasil analisis akan menampilkan tingkat risiko secara transparan, lengkap dengan persentase kemungkinan bahwa pesan tersebut adalah upaya manipulasi versus komunikasi yang sah.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                       <Crosshair className="w-5 h-5 text-rose-500" /> Bedah Taktik Psikologis
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      Laporan akan membongkar trik yang digunakan secara mendalam, seperti manipulasi urgensi (memaksa Anda bertindak cepat), manipulasi ketakutan (ancaman akun diblokir), atau pancingan kedekatan emosional.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                       <Search className="w-5 h-5 text-amber-500" /> Investigasi Lanjutan
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      Jika pesan mengandung nomor rekening, nomor telepon, atau tautan eksternal, sistem akan mengekstrak entitas tersebut dengan aman dan memberikan saran, serta menyediakan tombol pengecekan eksternal secara terkontrol.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                       <Share2 className="w-5 h-5 text-indigo-500" /> Notifikasi Internal Obyektif
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      Untuk menghindari tuduhan sepihak atau tindakan provokatif, disediakan template perlindungan netral. Template ini diformulasikan obyektif untuk diinformasikan kepada rekan kerja atau keluarga secara privat.
                    </p>
                  </div>
                </div>
                
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                  <button 
                    onClick={() => setShowGuide(false)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Tutup Panduan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        )}
      </main>
      </div>
    </div>
  );
}
