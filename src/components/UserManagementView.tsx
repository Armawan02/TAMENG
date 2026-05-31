import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Ban, Mailbox, ShieldAlert, Loader2, CheckCircle2, UserPlus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'polri';
  status: 'active' | 'suspended';
  createdAt?: any;
  lastLoginAt?: any;
}

export function UserManagementView() {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'polri' | 'admin' | 'user'>('polri');

  useEffect(() => {
    if (role !== 'admin') return;

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  const handleUpdateUserStatus = async (uid: string, newStatus: string) => {
    try {
      setActionLoading(uid + '-status');
      await updateDoc(doc(db, 'users', uid), { status: newStatus });
    } catch (e) {
      console.error(e);
      alert('Gagal merubah status: ' + e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUserRole = async (uid: string, newRole: string) => {
    try {
      setActionLoading(uid + '-role');
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (e) {
      console.error(e);
      alert('Gagal merubah hak akses: ' + e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    try {
      setActionLoading('add');
      const newUid = 'manual-' + Date.now();
      await setDoc(doc(db, 'users', newUid), {
        uid: newUid,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        status: 'active',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('polri');
    } catch (err) {
      console.error(err);
      alert('Gagal menambah entitas baru');
    } finally {
      setActionLoading(null);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-500 dark:text-rose-400 mb-6 border border-rose-200 dark:border-rose-800/50">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Akses Administratif Ditolak</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Anda memerlukan kredensial Administrator level 1 untuk mengakses manajemen wilayah ini.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-500" /> Manajemen Pengguna
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Pengaturan kewenangan, kontrol hak akses operasional, dan pemantauan entitas akun terdaftar.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-[2rem] shadow-sm backdrop-blur-xl shrink-0 h-full flex flex-col">
        <div className="p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-xl">
               <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
             </div>
             <div>
               <h3 className="font-bold text-slate-800 dark:text-white text-lg">Direktori Entitas Aktif</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">{users.length} Total Pengguna</p>
             </div>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Cari nama atau email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-5 py-3 pl-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm w-full sm:w-72 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200"
              />
              <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Entitas</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-24 text-slate-400">
               <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
               <p className="text-sm font-medium">Sinkronisasi Pangkalan Data...</p>
             </div>
          ) : filteredUsers.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-24 text-slate-400">
               <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
               <p className="text-sm font-bold text-slate-500">Tidak ada entitas yang sesuai dengan kriteria.</p>
             </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-8 py-5">Identitas Subjek</th>
                  <th className="px-8 py-5">Kewenangan</th>
                  <th className="px-8 py-5">Integritas</th>
                  <th className="px-8 py-5 text-right w-64">Otorisasi Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{u.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                        u.role === 'admin' ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 shadow-sm border border-fuchsia-200 dark:border-fuchsia-900/50' :
                        u.role === 'polri' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm border border-indigo-200 dark:border-indigo-900/50' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {u.role === 'admin' && <ShieldAlert className="w-3 h-3" />}
                        {u.role === 'polri' && <ShieldCheck className="w-3 h-3" />}
                        {u.role === 'user' && <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />}
                        {u.role === 'admin' ? 'Root Admin' : u.role === 'polri' ? 'Satgas Penuh' : 'Warga Sipil'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {u.status === 'active' ? (
                        <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span> 
                          Aman (Aktif)
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                          <Ban className="w-3 h-3" /> Ditangguhkan
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                      {u.uid !== user?.uid && (
                        <>
                          {u.role !== 'admin' && (
                            <button 
                              onClick={() => handleUpdateUserRole(u.uid, u.role === 'polri' ? 'user' : 'polri')}
                              disabled={actionLoading !== null}
                              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex-none disabled:opacity-50 inline-flex items-center gap-1.5 ${
                                u.role === 'user' 
                                  ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-900/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20'
                                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20'
                              }`}
                            >
                              {actionLoading === u.uid + '-role' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (u.role === 'user' ? 'Lantik Satgas' : 'Cabut Kewenangan')}
                            </button>
                          )}
                          <button 
                            onClick={() => handleUpdateUserStatus(u.uid, u.status === 'active' ? 'suspended' : 'active')}
                            disabled={actionLoading !== null}
                            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex-none disabled:opacity-50 inline-flex items-center gap-1.5 ${
                              u.status === 'active'
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
                            }`}
                          >
                           {actionLoading === u.uid + '-status' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (u.status === 'active' ? 'Bekukan' : 'Pulihkan')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Registrasi Entitas Otoritas</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap / Instansi</label>
                <input 
                  type="text" 
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Contoh: Bripka Junaidi"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Alamat Email Resmi</label>
                <input 
                  type="email" 
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="Contoh: junaidi@tameng.id / polri.go.id"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tingkat Kewenangan</label>
                <select 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                >
                  <option value="polri">Satgas Siber (Polri)</option>
                  <option value="admin">Administrator Penuh (Admin)</option>
                  <option value="user">Warga Sipil</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading === 'add'}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
