import React, { useState, useEffect } from 'react';
import { Target, AlertTriangle, ShieldCheck, TrendingUp, Users, Activity, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, getCountFromServer } from 'firebase/firestore';

interface Alert {
  id: string;
  title: string;
  desc: string;
  type: string;
  status: string;
  createdAt: any;
  authorEmail: string;
  authorRole: string;
  imageUrl?: string;
}

export function DashboardView() {
  const { user, role } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'polri' && role !== 'admin') return;

    // Fetch alerts
    const alertsQuery = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];
      setAlerts(fetchedAlerts);
      setLoading(false);
    });

    // Fetch user count
    const fetchUserCount = async () => {
      try {
        const coll = collection(db, 'users');
        const snapshot = await getCountFromServer(coll);
        setUserCount(snapshot.data().count);
      } catch (e) {
        console.error("Gagal mendapat total user", e);
      }
    };
    fetchUserCount();

    return () => {
      unsubscribeAlerts();
    };
  }, [role]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const alertRef = doc(db, 'alerts', id);
      await updateDoc(alertRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Gagal memperbarui status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (role !== 'polri' && role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-500 dark:text-rose-400 mb-6 border border-rose-200 dark:border-rose-800/50">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Otorisasi Ditolak</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Anda tidak memiliki kredensial otoritas untuk mengakses dasbor komando ini.</p>
      </div>
    );
  }

  const reportsLast24h = alerts.filter(a => {
    if (!a.createdAt) return false;
    const past24h = new Date().getTime() - (24 * 60 * 60 * 1000);
    return a.createdAt.toMillis() > past24h;
  }).length;

  const takedownCount = alerts.filter(a => a.status === 'Takedown' || a.status === 'Tervalidasi').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2 flex items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-500" /> Pusat Komando Siber
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Sistem pemantauan dan penindakan tanggap darurat ancaman digital.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { icon: AlertTriangle, title: 'Laporan Total', val: alerts.length.toString(), color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
          { icon: Activity, title: 'Laporan (24J)', val: reportsLast24h.toString(), color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' },
          { icon: Target, title: 'Ditindaklanjuti', val: takedownCount.toString(), color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
          { icon: Users, title: 'Entitas Terdeteksi', val: userCount.toString(), color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm backdrop-blur-xl relative overflow-hidden group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1.5">{stat.title}</h3>
            <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Column: Alerts Management */}
        <div className="lg:col-span-8 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 md:p-8 shadow-sm backdrop-blur-xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
              </div>
              Antrean Penindakan Darurat
            </h3>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center p-24 h-full text-slate-400">
               <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
               <p className="text-sm font-medium">Sinkronisasi Data Residen...</p>
             </div>
          ) : alerts.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-24 h-full text-center">
               <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
               </div>
               <p className="text-slate-800 dark:text-white font-bold text-lg mb-1">Zona Hijau (Aman)</p>
               <p className="text-sm text-slate-500 font-medium tracking-wide">Seluruh laporan telah diselesaikan.</p>
             </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-2 -mr-2">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={alert.id} 
                    className="border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/30 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm ${
                            alert.type === 'Tinggi' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' :
                            alert.type === 'Sedang' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              alert.type === 'Tinggi' ? 'bg-rose-500' :
                              alert.type === 'Sedang' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            Resiko {alert.type}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm border ${
                           alert.status === 'Tervalidasi' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-900/50' :
                           alert.status === 'Investigasi' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-900/50' :
                           alert.status === 'Takedown' ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200' :
                           'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                           {alert.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg leading-tight mb-1">{alert.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{alert.desc}</p>
                        
                        <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <Users className="w-3.5 h-3.5 opacity-70" />
                          <span>Pelapor: <strong className="text-slate-700 dark:text-slate-300 font-bold">{alert.authorEmail || 'Anonim'}</strong></span>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-40 pt-1">
                        {alert.status === 'Investigasi' || alert.status === 'Tervalidasi' ? (
                          <button 
                            onClick={() => handleUpdateStatus(alert.id, 'Takedown')}
                            disabled={updatingId === alert.id}
                            className="w-full text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {updatingId === alert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Takedown <ArrowRight className="w-3.5 h-3.5" /></>}
                          </button>
                        ) : alert.status === 'Belum Diverifikasi' ? (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(alert.id, 'Investigasi')}
                              disabled={updatingId === alert.id}
                              className="w-full text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 dark:border-indigo-500/20 py-2.5 rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
                            >
                              Investigasi
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(alert.id, 'Tervalidasi')}
                              disabled={updatingId === alert.id}
                              className="w-full text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:border-emerald-500/20 py-2.5 rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
                            >
                              Validasi
                            </button>
                          </>
                        ) : (
                           <div className="w-full text-xs font-bold text-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl">
                             Diselesaikan
                           </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Column: Mini Logs */}
        <div className="lg:col-span-4 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 md:p-8 shadow-sm backdrop-blur-xl shrink-0">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
             <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
               <AlertTriangle className="w-5 h-5 text-amber-500" />
             </div>
             Log Tindakan Eksekusi
           </h3>
           <div className="space-y-5">
             {alerts.filter(a => a.status === 'Takedown' || a.status === 'Investigasi').slice(0, 5).map((log, i) => (
               <div key={i} className="flex gap-4 group">
                 <div className="flex flex-col items-center">
                   <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 bg-slate-200 dark:bg-slate-700 ${log.status === 'Takedown' ? 'ring-4 ring-emerald-50 dark:ring-emerald-500/10' : 'ring-4 ring-indigo-50 dark:ring-indigo-500/10'}`}>
                     <div className={`w-full h-full rounded-full ${log.status === 'Takedown' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                   </div>
                   {i < 4 && <div className="flex-1 w-px bg-slate-100 dark:bg-slate-800 mt-2" />}
                 </div>
                 <div className="flex-1 pb-4">
                   <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{log.status}</p>
                   <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{log.title}</p>
                 </div>
               </div>
             ))}
             {alerts.filter(a => a.status === 'Takedown' || a.status === 'Investigasi').length === 0 && (
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic text-center py-8">Log takedown masih kosong.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

