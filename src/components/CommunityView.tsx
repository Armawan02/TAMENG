import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Activity, Bell, Loader2, Plus, Image as ImageIcon, Lock, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, auth, storage } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Alert {
  id: string;
  type: string;
  title: string;
  desc: string;
  reportsCount: number;
  time: string;
  status?: 'pending' | 'investigating' | 'resolved';
  imageUrl?: string;
  authorName?: string;
  isAnonymous?: boolean;
}

export function CommunityView() {
  const { user, role, loginWithGoogle } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ title: '', desc: '', type: 'Sedang' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthorityMode = role === 'polri' || role === 'admin';

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'alerts', id), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alerts/${id}`);
    }
  };

  useEffect(() => {
    const handleOpenForm = () => setShowForm(true);
    window.addEventListener('open-community-form', handleOpenForm);
    return () => window.removeEventListener('open-community-form', handleOpenForm);
  }, []);

  useEffect(() => {
    const alertsQuery = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeStr = 'Baru saja';
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
          if (diffMinutes < 60) timeStr = `${diffMinutes} menit lalu`;
          else if (diffMinutes < 1440) timeStr = `${Math.floor(diffMinutes / 60)} jam lalu`;
          else timeStr = `${Math.floor(diffMinutes / 1440)} hari lalu`;
        }

        return {
          id: doc.id,
          type: data.type || 'Sedang',
          title: data.title,
          desc: data.desc,
          reportsCount: data.reportsCount || 1,
          time: timeStr,
          status: data.status || 'pending',
          imageUrl: data.imageUrl,
          authorName: data.authorName || 'Anonim',
          isAnonymous: data.isAnonymous || false
        };
      });
      setAlerts(fetchedAlerts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'alerts');
      setLoading(false);
    });

    return () => {
      unsubscribeAlerts();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      handleLogin();
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (!user.emailVerified) {
        alert("Email harus diverifikasi untuk membuat laporan.");
        setIsSubmitting(false);
        return;
      }

      let imageUrl = '';
      if (imageFile) {
        const fileRef = ref(storage, `alerts/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(fileRef, imageFile);
        imageUrl = await getDownloadURL(fileRef);
      }

      const alertData: any = {
        title: newAlert.title,
        desc: newAlert.desc,
        type: newAlert.type,
        reportsCount: 1,
        authorId: user.uid,
        authorName: isAnonymous ? 'Anonim' : (user.displayName || 'Pengguna'),
        isAnonymous: isAnonymous,
        createdAt: serverTimestamp()
      };
      if (imageUrl) alertData.imageUrl = imageUrl;

      await addDoc(collection(db, 'alerts'), alertData);
      setNewAlert({ title: '', desc: '', type: 'Sedang' });
      setImageFile(null);
      setShowForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'alerts');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-6 max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest mx-auto mb-4">
           <MessageSquare className="w-4 h-4 text-emerald-500" />
           <span className="opacity-90">Forum Peringatan Dini</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-black text-slate-800 dark:text-white tracking-tight leading-[1.1]">
          Radar <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-400">Komunitas Pribadi.</span>
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto mt-6">
          Pantau tren ancaman siber terbaru berdasarkan pola manipulasi yang dilaporkan hari ini. Bagikan informasi untuk mencegah orang lain menjadi korban.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alerts Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Tren Modus Saat Ini
            </h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12 bg-white/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">Belum ada peringatan yang dilaporkan.</p>
              </div>
            ) : alerts.map((alert) => (
              <div key={alert.id} className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0",
                      alert.type === 'Tinggi' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                      Ancaman {alert.type}
                    </span>
                    
                    {/* Status Badge */}
                    {alert.status === 'investigating' && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 shrink-0 border border-blue-200 dark:border-blue-500/30">
                        🛡️ Verifikasi Otoritas
                      </span>
                    )}
                    {alert.status === 'resolved' && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-500/30">
                        ✅ Selesai / Takedown
                      </span>
                    )}

                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 shrink-0">
                      Oleh: {alert.authorName || 'Anonim'}
                    </span>

                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 shrink-0">
                      <Bell className="w-3 h-3" /> {alert.time}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full shrink-0">
                    {alert.reportsCount} laporan
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {alert.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
                  {alert.desc}
                </p>

                {alert.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <img src={alert.imageUrl} alt="Bukti laporan" className="w-full h-48 object-cover" />
                  </div>
                )}

                {/* Authority Action Panel Simulation */}
                {isAuthorityMode && (
                  <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(alert.id, 'investigating')}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg transition-colors border border-blue-200 dark:border-blue-500/30">
                      Tandai Investigasi
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/30">
                      Tandai Takedown
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Column */}
        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20">
             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
             <AlertTriangle className="w-8 h-8 text-indigo-200 mb-4" />
             <h3 className="text-xl font-bold mb-2">Bantu Komunitas</h3>
             <p className="text-indigo-100 text-sm leading-relaxed mb-6">
               Apakah Anda menemukan modus baru yang belum ada di radar? Bagikan anonim untuk membantu intelijen TAMENG mengenali polanya.
             </p>
             <button 
               onClick={() => setShowForm(true)}
               className="w-full py-3 bg-white text-indigo-600 hover:bg-slate-50 font-bold rounded-xl transition-colors shadow-sm">
               Laporkan Modus Baru
             </button>
           </div>

           {/* Create Form Overlay */}
           <AnimatePresence>
             {showForm && (
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                 onClick={() => setShowForm(false)}
               >
                 <motion.div 
                   initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                   onClick={(e) => e.stopPropagation()}
                   className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative"
                 >
                   <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Laporkan Modus Baru</h2>
                   {user ? (
                     <form onSubmit={handleSubmit} className="space-y-4">
                       <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Judul Peringatan</label>
                         <input 
                           type="text" 
                           required 
                           maxLength={100}
                           value={newAlert.title}
                           onChange={e => setNewAlert({...newAlert, title: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                           placeholder="Contoh: Lowongan Kerja Bodong Telegram"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tingkat Ancaman</label>
                         <select 
                           value={newAlert.type}
                           onChange={e => setNewAlert({...newAlert, type: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-indigo-500 appearance-none"
                         >
                           <option value="Tinggi">Tinggi (Menimbulkan kerugian materiil)</option>
                           <option value="Sedang">Sedang (Hanya mencuri data pribadi)</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Deskripsi Modus</label>
                         <textarea 
                           required 
                           maxLength={500}
                           rows={4}
                           value={newAlert.desc}
                           onChange={e => setNewAlert({...newAlert, desc: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-indigo-500 resize-none"
                           placeholder="Jelaskan secara singkat bagaimana modus ini bekerja..."
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bukti Gambar Tangkapan Layar (Opsional)</label>
                         <div className="relative">
                           <input 
                             type="file" 
                             accept="image/*"
                             onChange={e => {
                               if (e.target.files && e.target.files[0]) {
                                 setImageFile(e.target.files[0]);
                               }
                             }}
                             className="hidden"
                             id="image-upload"
                           />
                           <label htmlFor="image-upload" className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-dashed rounded-xl px-4 py-8 text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                             <ImageIcon className="w-5 h-5" />
                             <span className="font-medium text-sm">
                               {imageFile ? imageFile.name : 'Pilih Gambar (Maks 5MB)'}
                             </span>
                           </label>
                           {imageFile && (
                             <button type="button" onClick={() => setImageFile(null)} className="absolute top-2 right-2 p-1 bg-rose-100 text-rose-600 rounded-lg text-xs font-bold px-2 hover:bg-rose-200">Hapus</button>
                           )}
                         </div>
                       </div>
                       <div className="flex items-center gap-2 pt-4">
                         <label className="flex items-center gap-2 cursor-pointer">
                           <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded" />
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Sembunyikan nama (Anonim)</span>
                         </label>
                       </div>
                       <div className="pt-4 flex gap-3">
                         <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Batal</button>
                         <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
                           {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Laporan'}
                         </button>
                       </div>
                     </form>
                   ) : (
                     <div className="text-center py-6">
                       <p className="text-slate-600 dark:text-slate-400 mb-6">Anda harus masuk dengan Google untuk melaporkan modus baru. Ini untuk memastikan kualitas intelijen komunitas.</p>
                       <button onClick={handleLogin} className="w-full py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition-colors">
                         Masuk dengan Google
                       </button>
                     </div>
                   )}
                 </motion.div>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-6">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
               Informasi Pola Target
             </h3>
             <ul className="space-y-3 text-sm">
               <li className="flex items-center justify-between">
                 <span className="text-slate-600 dark:text-slate-400">Target Usia</span>
                 <span className="font-medium text-slate-800 dark:text-slate-200">50+ Tahun</span>
               </li>
               <li className="flex items-center justify-between">
                 <span className="text-slate-600 dark:text-slate-400">Media Utama</span>
                 <span className="font-medium text-slate-800 dark:text-slate-200">WhatsApp / SMS</span>
               </li>
               <li className="flex items-center justify-between">
                 <span className="text-slate-600 dark:text-slate-400">Taktik</span>
                 <span className="font-medium text-slate-800 dark:text-slate-200">Manipulasi Ketakutan</span>
               </li>
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
