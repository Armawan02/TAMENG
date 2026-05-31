import React, { useState } from 'react';
import { Anchor, Brain, ShieldAlert, HeartHandshake, PhoneCall, ChevronRight, AlertTriangle, Crosshair, Siren, ShieldCheck, FileWarning, EyeOff, Activity, Stethoscope, FileHeart } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function RecoveryView() {
  const [assessmentState, setAssessmentState] = useState<'idle' | 'testing' | 'result'>('idle');
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);

  const judolQuestions = [
    "Apakah Anda pernah meminjam uang (Pinjol/Teman) secara rahasia untuk bermain?",
    "Apakah Anda merasa harus bertaruh lebih besar setiap kalinya agar terasa 'menantang'?",
    "Apakah Anda bermain untuk melarikan diri dari kesedihan, stres, atau rasa bersalah?",
    "Pernahkah Anda berbohong soal jumlah uang atau waktu yang Anda habiskan untuk berjudi?",
    "Apakah perjudian telah merusak hubungan penting atau pekerjaan dalam hidup Anda?",
    "Pernahkah Anda menjual barang (gadget/Buku BPKB/sertifikat) demi modal depo?",
    "Apakah Anda terus kepikiran tentang sesi bermain berikutnya walau sedang bekerja/kumpul keluarga?",
    "Apakah Anda langsung ingin bermain lagi ('chasing losses') tepat setelah kalah besar?",
    "Pernahkah Anda mengabaikan tagihan wajib (listrik/KPR/SPP) karena uangnya terpakai berjudi?",
    "Apakah Anda merasa hidup terasa hampa dan bosan jika tidak ada taruhan yang berjalan?",
    "Pernahkah Anda melakukan tindakan ilegal (menggelapkan dana perusahaan/mencuri) untuk modal?",
    "Apakah pola tidur Anda hancur karena begadang menunggu permainan (scatter/jp) di dini hari?",
    "Apakah Anda sering menghitung-hitung bahwa kemenangan besar adalah satu-satunya jalan keluar utang Anda?",
    "Pernahkah Anda meminjam akun orang lain (atau KTP orang) karena akun Anda kena limit/diblokir pinjol?",
    "Pernahkah Anda merenungi dan menangisi kekalahan, lalu beberapa jam kemudian kembali deposit lagi?",
    "Apakah Anda mengisolasi diri dari teman-teman yang tidak bermain karena merasa mereka tidak 'paham' Anda?",
    "Pernahkah terbersit niat untuk menyakiti diri sendiri akibat tekanan utang judi online?",
    "Apakah Anda menggunakan 'sisa limit paylater' app e-commerce untuk dicairkan dan dimainkan?",
    "Apakah Anda merasa bangga/sombong kepada teman saat menang, namun diam seribu bahasa saat kalah?",
    "Pernahkah Anda berjanji pada diri sendiri atau pasangan 'INI YANG TERAKHIR', namun melanggarnya keesokan hari?"
  ];

  const handleAnswer = (val: 'yes' | 'no') => {
    if (val === 'yes') setScore(s => s + 1);
    
    if (currentQ < judolQuestions.length - 1) {
      setCurrentQ(c => c + 1);
    } else {
      setAssessmentState('result');
    }
  };

  const resetTest = () => {
    setScore(0);
    setCurrentQ(0);
    setAssessmentState('idle');
  }

  const dispatchCommunityForm = () => {
    window.dispatchEvent(new CustomEvent('open-community-form'));
    
    // The previous approach relying on querySelector might fail due to rendering layers or state delays 
    // Dispatch a global event to change the tab
    window.dispatchEvent(new CustomEvent('change-tab', { detail: { tab: 'community' } }));
  };

  // Determine severity tier based on 20 questions
  const getSeverity = () => {
    if (score >= 15) return {
      level: 'KRITIS - DARURAT PSIKIATRIS',
      color: 'bg-rose-600 text-white border-rose-800',
      text: 'rose',
      desc: 'Sistem dopamin Anda telah diretas sempurna oleh algoritma. Perjudian bukan lagi rekreasi, ini adalah penyakit adiksi berat (Pathological Gambling). Otak Anda telah terprogram untuk terus menghancurkan diri. ANDA TIDAK BISA BERHENTI SENDIRIAN. Intervensi pihak ketiga/keluarga mutlak diperlukan segera. Hubungi rehabilitasi sebelum terlambat.'
    };
    if (score >= 8) return {
      level: 'BERBAHAYA - KECANDUAN AKTIF',
      color: 'bg-orange-500 text-white border-orange-700',
      text: 'orange',
      desc: 'Anda berada dalam fase "Chasing Losses". Lingkaran setan telah dimulai. Anda percaya pada ilusi ilogis bahwa Anda bisa menang dan balik modal. Itu adalah tipu daya matematis mesin. Segera putus rantai keuangan, hapus akun M-Banking, dan laporkan utang Anda ke keluarga terdekat.'
    };
    if (score >= 3) return {
      level: 'TERPAPAR RUANG TRANSISI',
      color: 'bg-amber-400 text-slate-900 border-amber-600',
      text: 'amber',
      desc: 'Peringatan dini. Anda mulai menunjukkan gejala adiksi. Mesin sedang membentuk pola psikologis Anda melalui kemenangan demi kemenangan kecil, menyiapkan jebakan kekalahan besar yang akan menguras masa depan Anda. Berhenti sekarang. Hapus aplikasinya dan jangan pernah sentuh.'
    };
    return {
      level: 'ZONA AMAN (NORMAL)',
      color: 'bg-emerald-500 text-white border-emerald-700',
      text: 'emerald',
      desc: 'Anda memiliki kendali penuh atas rasionalitas Anda. Jangan pernah tergiur oleh flexing sosial media atau cerita fiktif jackpot besar. Terus blokir akses situs gelap dan bantu edukasi lingkungan terdekat Anda.'
    };
  };

  const severity = getSeverity();

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto pb-12">
      
      {/* Immersive Cyber-Intervention Banner */}
      <div className="relative bg-slate-950 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800/50 group">
        <div className="absolute inset-0 bg-blue-900/[0.03] backdrop-blur-3xl"></div>
        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20"></div>
        
        <div className="relative z-10 px-8 py-12 md:py-20 md:px-16 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-rose-500/10 rounded-full flex items-center justify-center border-4 border-rose-500/30 relative">
            <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full animate-pulse"></div>
            <Siren className="w-12 h-12 md:w-16 md:h-16 text-rose-500 shadow-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black text-xs uppercase tracking-[0.2em] mb-4">
              <ShieldAlert className="w-3.5 h-3.5" />
              Protokol Intervensi Level 4
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1] mb-5">
              Zona Pemulihan <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-orange-500">JUDOL.</span>
            </h1>
            <p className="text-slate-400 font-medium text-base md:text-lg max-w-2xl leading-relaxed">
              Ini bukan permainan. Ini adalah desain <strong className="text-rose-400">perampokan psikologis</strong> sistematis. Algoritma sengaja memanipulasi neurokimia (dopamin) otak Anda untuk menciptakan ketergantungan absolut. Mari cabut simpulnya hari ini.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
        
        {/* Left Column: Intelligence Facts */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-xl relative overflow-hidden backdrop-blur-xl">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-500/20 rounded-xl">
                <EyeOff className="w-6 h-6 text-rose-600 dark:text-rose-500" />
              </div>
              Dekonstruksi Ilusi Judi Online
            </h2>
            
            <div className="space-y-8">
              {[
                { no: "01", title: 'RNG Rigging (Manipulasi Acak)', desc: 'Sistem tidak acak. Algoritma merekam profil Anda, memberi kemenangan ("pancingan") di level awal, lalu menarik kembali (Return To Player yang dimanipulasi) di menit berikutnya. Anda bermain melawan superkomputer yang dirancang secara matematis untuk menyedot uang Anda.', color: 'rose' },
                { no: "02", title: 'Double Extortion (Pinjol Ilegal)', desc: 'Ketika uang tunai Anda habis, sindikat sudah menyiapkan afiliasi Pinjaman Online Ilegal. Data identitas Anda dijual dan dieksploitasi, memaksa Anda berutang dengan bunga harian mencekik demi siklus deposit yang tak ada ujungnya.', color: 'amber' },
                { no: "03", title: 'Sindikat Transnasional', desc: 'Setiap rupiah yang anda "depositkan" mengalir keluar negeri mendanai kartel kriminal, mafia perdagangan manusia (TPPO), dan pencucian uang. Berjudi tidak akan menyelesaikan beban finansial keluarga, melainkan mendanai kejahatan brutal berskala global.', color: 'indigo' }
              ].map((item, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-500/10 border border-${item.color}-200 dark:border-${item.color}-500/20 text-${item.color}-600 dark:text-${item.color}-400 flex items-center justify-center shrink-0 font-black font-mono text-lg transition-transform group-hover:scale-110`}>
                    {item.no}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-wide mb-1.5">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border-2 border-indigo-500/20">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none"></div>
             
             <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
               <div className="p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl shrink-0">
                 <ShieldCheck className="w-8 h-8 text-indigo-400" />
               </div>
               <div>
                 <h3 className="font-black text-white text-2xl mb-2">Bantu Kami Hancurkan Infrastruktur Mereka</h3>
                 <p className="text-indigo-200 text-sm leading-relaxed mb-6 font-medium">
                   Operasi siber butuh data dari warga. Apabila Anda mengetahui nomor rekening pengepul yang digunakan bandar, atau link web afiliasi pencari mangsa, segera serahkan ke kami. Laporan ini bisa dilakukan secara anonim.
                 </p>
                 <button 
                  onClick={dispatchCommunityForm}
                  className="w-full sm:w-auto px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold tracking-wide rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                 >
                   BUKA FORM LAPORAN INTELIJEN
                 </button>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: 20-Q Assessment & Evacuation Route */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
             
             <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                 <Activity className="w-5 h-5 text-slate-700 dark:text-slate-300" />
               </div>
               <h3 className="font-black text-slate-800 dark:text-white text-lg tracking-tight">EVALUASI KLINIS (20-POINT)</h3>
             </div>
             
             <AnimatePresence mode="wait">
               {assessmentState === 'idle' && (
                 <motion.div 
                   key="idle"
                   initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                   className="text-center py-4"
                 >
                   <div className="w-20 h-20 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700">
                     <Brain className="w-10 h-10 text-slate-400" />
                   </div>
                   <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Seberapa Parah Tingkat Paparan Anda?</h4>
                   <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed font-medium px-4">
                     Kerjakan instrumen 20 pertanyaan psikologis (berbasis DSM-5 Pathological Gambling) untuk memetakan level adiksi Anda. Tes diproses lokal tanpa menyimpan data.
                   </p>
                   <button 
                     onClick={() => setAssessmentState('testing')}
                     className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition-all shadow-lg active:scale-95"
                   >
                     Mulai Uji Kerentanan Abstrak
                   </button>
                 </motion.div>
               )}

               {assessmentState === 'testing' && (
                 <motion.div 
                   key="testing"
                   initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                   className="space-y-6"
                 >
                   <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                     <span>Pertanyaan {currentQ + 1} dari 20</span>
                     <span>Score: {score}</span>
                   </div>
                   
                   {/* Progress bar */}
                   <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentQ) / 20) * 100}%` }}></div>
                   </div>

                   <h4 className="text-xl font-bold text-slate-800 dark:text-white leading-relaxed min-h-[120px] py-4">
                     "{judolQuestions[currentQ]}"
                   </h4>

                   <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => handleAnswer('yes')}
                       className="py-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-black text-lg rounded-xl transition-colors"
                     >
                       IYA
                     </button>
                     <button 
                       onClick={() => handleAnswer('no')}
                       className="py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/50 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-lg rounded-xl transition-colors"
                     >
                       TIDAK
                     </button>
                   </div>
                 </motion.div>
               )}

               {assessmentState === 'result' && (
                 <motion.div 
                   key="result"
                   initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                   className="text-center"
                 >
                   <div className={cn(
                     "w-24 h-24 mx-auto rounded-full flex flex-col items-center justify-center font-black mb-5 border-[6px] shadow-lg",
                     severity.color
                   )}>
                     <span className="text-3xl leading-none">{score}</span>
                     <span className="text-[10px] uppercase opacity-80 font-bold">/ 20 Pts</span>
                   </div>
                   
                   <h4 className={cn("font-black text-xl mb-3", `text-${severity.text}-600 dark:text-${severity.text}-400`)}>
                     {severity.level}
                   </h4>
                   
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 text-left mb-6">
                     <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                       {severity.desc}
                     </p>
                   </div>
                   
                   <button 
                     onClick={resetTest}
                     className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold text-sm tracking-wide uppercase underline transition-colors"
                   >
                     Mulai Ulang Tes
                   </button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <div className="bg-rose-600 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
             {/* Diagonal stripes background */}
             <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]"></div>
             
             <div className="relative z-10 text-white space-y-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 border-2 border-white rounded-xl bg-rose-700">
                   <Stethoscope className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="font-black text-2xl tracking-tighter uppercase">Jalur Evakuasi Darurat</h3>
               </div>
               
               <p className="text-rose-100 text-sm leading-relaxed font-medium">
                 Guncangan psikologis hebat (Depresi, PTSD, Adiksi) akibat kekalahan beruntun **TIDAK BISA DISIMPAN SENDIRI**. Jika ada pikiran untuk mengakhiri hidup atau kehancuran fungsi sosial, segera panggil evakuasi medis / konseling profesional.
               </p>
               
               <div className="space-y-3">
                 <a href="tel:119" className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl transition-all shadow-lg active:scale-[0.98] group">
                   <div className="flex items-center gap-4">
                     <div className="bg-rose-600 p-2.5 rounded-lg text-white">
                       <PhoneCall className="w-5 h-5" />
                     </div>
                     <div className="text-left">
                       <h4 className="text-slate-900 font-black text-lg leading-tight uppercase">Call Center 119</h4>
                       <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Ext 8 (Kemenkes Sejiwa)</p>
                     </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-500 transition-colors" />
                 </a>

                 <a href="https://wa.me/628113855472" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-rose-800 hover:bg-rose-900 border border-rose-500/50 rounded-xl transition-all shadow-lg active:scale-[0.98] group">
                   <div className="flex items-center gap-4">
                     <div className="bg-rose-700 border border-rose-600 p-2.5 rounded-lg text-rose-200">
                       <HeartHandshake className="w-5 h-5" />
                     </div>
                     <div className="text-left">
                       <h4 className="text-white font-black text-lg leading-tight uppercase">Yayasan Pulih</h4>
                       <p className="text-rose-200 font-bold text-xs uppercase tracking-widest">Bantuan Psikologis WA</p>
                     </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-rose-300 group-hover:text-white transition-colors" />
                 </a>
               </div>
               
               <p className="text-center text-[10px] text-rose-200 font-bold uppercase tracking-[0.2em] pt-4">Tersedia Kapanpun Anda Siap • Dijamin Rahasia</p>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
