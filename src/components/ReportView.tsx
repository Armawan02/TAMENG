import React, { useState } from 'react';
import { ShieldAlert, Crosshair, MapPin, Copy, ExternalLink, Scale, CheckCircle2, FileText, Building, Building2, Server, AlertTriangle, FileCheck, PhoneCall, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function ReportView() {
  const [reportCopied, setReportCopied] = useState(false);
  const [category, setCategory] = useState('Penipuan Transaksi Online');
  const [chronology, setChronology] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleReport = `FORMULIR LAPORAN DUGAAN TINDAK PIDANA SIBER

I. DATA PELAPOR
Nama Lengkap      : [Isi Nama Sesuai KTP]
Nomor Identitas   : [NIK KTP]
Nomor Telepon     : [Nomor yang bisa dihubungi]

II. KRONOLOGI KEJADIAN
Tanggal & Waktu   : [TGL/BLN/THN, Jam Keserentakan]
Platform Target   : [Contoh: WhatsApp, Instagram, Telepon]
Nomor/Akun Pelaku : [Identitas Pelaku]

III. DESKRIPSI INDIKASI MANIPULASI
Berdasarkan hasil pemindaian TAMENG, pesan/tautan yang dikirim diklasifikasikan sebagai:
- Jenis Ancaman   : Eksploitasi Nalar Gawai / Social Engineering
- Modus           : [Misal: Mengaku kurir paket / Anggota Kepolisian]

IV. BARANG BUKTI TERLAMPIR
[ ] Tangkapan layar (Screenshot) percakapan utuh
[ ] Tanda bukti transfer (Jika ada kerugian material)
[ ] URL/Tautan berbahaya (Jangan diklik)

Demikian laporan ini dibuat dengan sebenar-benarnya untuk ditindaklanjuti secara hukum.`;

  const handleGenerate = async () => {
    if (!chronology.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/generate_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, chronology })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal generate');
      setGeneratedReport(data.report_text);
      setAdvice(data.advice);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReport || sampleReport);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* Official Warning Banner */}
      <div className="bg-rose-500/10 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-rose-700 dark:text-rose-400">PERINGATAN RESMI</h3>
          <p className="text-sm text-rose-600 dark:text-rose-300 mt-1 leading-relaxed">
            Portal ini ditujukan untuk memfasilitasi eskalasi temuan kejahatan siber ke Otoritas Penegak Hukum RI. Dilarang memberikan laporan palsu (Prank) yang dapat dijerat UU ITE Pasal 28 ayat 1.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-800 border border-slate-700 text-white font-bold text-xs uppercase tracking-widest mb-4">
             <Scale className="w-4 h-4" />
             <span>Divisi Pelaporan Terpadu</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight">
            Portal Eskalasi <span className="text-indigo-600 dark:text-indigo-400">Hukum.</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-3 max-w-2xl">
            Sistem fasilitasi penyiapan laporan struktural untuk diteruskan ke Direktorat Tindak Pidana Siber Bareskrim Polri dan Kementerian Kominfo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="tel:110" className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-600/20">
            <PhoneCall className="w-5 h-5" />
            Call Center 110
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Template */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-indigo-600 rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
             <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
                <FileText className="w-48 h-48" />
             </div>
             <div className="relative z-10 space-y-4">
               <div>
                  <h2 className="text-2xl font-black mb-1">AI Assisten Pelaporan SPKT</h2>
                  <p className="text-indigo-200 text-sm font-medium">Bantu kami mengetahui kronologi singkat kejadian. Sistem TAMENG akan merapikan tata bahasa agar sesuai standar Laporan Polisi (STTLP).</p>
               </div>
               
               <div className="grid gap-4">
                 <div>
                   <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 block">Kategori Tindak Pidana</label>
                   <select 
                     value={category}
                     onChange={(e) => setCategory(e.target.value)}
                     className="w-full bg-white/10 border border-indigo-400/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white text-white appearance-none"
                   >
                     <option value="Penipuan Transaksi Online" className="text-slate-900">Penipuan Transaksi Online</option>
                     <option value="Phishing / APK Palsu" className="text-slate-900">Phishing / File APK Palsu</option>
                     <option value="Pemerasan / Pengancaman" className="text-slate-900">Pemerasan / Pengancaman</option>
                     <option value="Penyebaran Data Pribadi (Doxing)" className="text-slate-900">Penyebaran Data Pribadi (Doxing)</option>
                     <option value="Penipuan Lowongan Kerja" className="text-slate-900">Penipuan Lowongan Kerja Fiktif</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 block">Kronologi Singkat Kejadian</label>
                   <textarea 
                     value={chronology}
                     onChange={(e) => setChronology(e.target.value)}
                     placeholder="Ceritakan dengan bahasa Anda sendiri (Misal: Kemarin sore ada yang WA saya nipu pakai APK undangan...)"
                     className="w-full h-28 bg-white/10 border border-indigo-400/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white text-white resize-none placeholder:text-indigo-300/50"
                   />
                 </div>
                 
                 {errorMsg && <div className="text-rose-200 text-xs font-bold bg-rose-900/50 p-3 rounded-xl border border-rose-500/50">{errorMsg}</div>}
                 
                 <button
                   onClick={handleGenerate}
                   disabled={!chronology.trim() || isGenerating}
                   className="w-full mt-2 bg-white text-indigo-700 hover:bg-slate-50 font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                 >
                   {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                   {isGenerating ? 'MENYUSUN BERKAS (AI)...' : 'GENERATE DRAF LAPORAN POLISI'}
                 </button>
               </div>
             </div>
          </div>
          
          <AnimatePresence mode="wait">
            {generatedReport && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2">Rekomendasi Tindakan Fisik</h3>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200/80 leading-relaxed font-medium">{advice}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between mt-0">
               <div className="flex items-center gap-3">
                 <Scale className="w-5 h-5 text-slate-500" />
                 <h2 className="font-bold text-slate-800 dark:text-white">Preview Draf STTLP</h2>
               </div>
               <div className="flex gap-2">
                 {generatedReport && (
                   <button
                     onClick={() => { setGeneratedReport(null); setChronology(''); setAdvice(null); }}
                     className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                   >
                     Reset
                   </button>
                 )}
                 <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-lg shadow-sm transition-colors"
                  >
                    {reportCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {reportCopied ? 'Tersalin' : 'Salin Berkas'}
                  </button>
               </div>
            </div>
            <div className="p-6 relative group bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-none">
              <pre className="text-sm text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
                {generatedReport || sampleReport}
              </pre>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-3">
              <FileCheck className="w-5 h-5" /> Protokol Pengumpulan Bukti
            </h3>
            <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200/80 list-disc pl-5">
              <li>Pastikan screenshot memperlihatkan <strong>nomor pengirim</strong> dan <strong>jam pengiriman</strong> secara jelas.</li>
              <li>Jangan melakukan konfrontasi dengan pelaku (memaki/mengancam balik) karena dapat merusak pengumpulan bukti.</li>
              <li>Simpan bukti mutasi rekening jika Anda terlanjur melakukan transfer dana.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Authorities */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2 mb-2">Integrasi Laporan Otoritas</h2>
          
          {/* SPKT Bareskrim (Offline Fallback) */}
          <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl p-5 transition-all shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                 <Building className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">SPKT Polri (Laporan Fisik)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 mt-1">Sentra Pelayanan Kepolisian Terpadu - Jika portal web Patroli Siber memblokir IP Anda, bawa bukti cetak ke SPKT terdekat.</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-500/20 px-2 py-0.5 rounded">Tindakan Cepat</span>
                </div>
              </div>
            </div>
            <a href="https://www.google.com/maps/search/kantor+polisi+terdekat" target="_blank" rel="noopener noreferrer" className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors">
              Cari Kantor Polisi Terdekat <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* SP4N LAPOR.GO.ID */}
          <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl p-5 transition-all shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                 <Building2 className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">SP4N LAPOR!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 mt-1">Sistem Pengelolaan Pengaduan Pelayanan Publik Nasional - Portal aduan resmi pemerintah RI yang sangat andal.</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/20 px-2 py-0.5 rounded">Aduan Nasional</span>
                </div>
              </div>
            </div>
            <a href="https://www.lapor.go.id/" target="_blank" rel="noopener noreferrer" className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors">
              Buat Aduan Publik <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* CekRekening */}
          <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl p-5 transition-all shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                 <Server className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">CekRekening.id</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 mt-1">Aduan nomor rekening bank atau e-wallet yang digunakan pelaku penipuan / indikasi kejahatan (Kominfo).</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/20 px-2 py-0.5 rounded">Pemblokiran Saldo</span>
                </div>
              </div>
            </div>
            <a href="https://cekrekening.id" target="_blank" rel="noopener noreferrer" className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors">
              Laporkan Rekening <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
