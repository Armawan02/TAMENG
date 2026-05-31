import React, { useState } from 'react';
import { X, Mail, ShieldCheck, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal login. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await loginWithEmail(email, password);
      onClose();
    } catch (err: any) {
      setError(`Gagal: ${err.code || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 p-8 relative">
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-center mb-6 mt-2">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                <ShieldCheck className="w-8 h-8" />
              </div>
            </div>
            
            {!isEmailMode ? (
              <>
                <h2 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2 tracking-tight">Akses Sistem</h2>
                <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-8 font-medium">Masuk untuk melaporkan kejahatan atau mengakses dasbor otoritas.</p>
                
                <div className="space-y-4">
                  <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50">
                    <Chrome className="w-5 h-5" />
                    Lanjutkan dengan Google
                  </button>
                  <button onClick={() => setIsEmailMode(true)} className="w-full flex items-center justify-center gap-3 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm">
                    <Mail className="w-5 h-5" />
                    Lanjutkan dengan Email
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2 tracking-tight">Otentikasi Kredensial</h2>
                <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6 font-medium">Gunakan kredensial otoritas atau email Anda.</p>
                
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-3">
                    <input
                      type="email"
                      required
                      placeholder="Email (misal: admin@tameng.id)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <input
                      type="password"
                      required
                      placeholder="Kata Sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                  {error && <p className="text-rose-500 text-sm mt-2 text-center font-bold px-2">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors mt-2 shadow-sm disabled:opacity-70">
                    {loading ? 'Memverifikasi...' : 'Otorisasi'}
                  </button>
                  <button type="button" onClick={() => setIsEmailMode(false)} className="w-full py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold rounded-xl transition-colors">
                    Kembali
                  </button>
                </form>
              </>
            )}
            
            {/* Demo Helpers */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/50">
              <p className="text-[10px] text-center font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Akun Demo (Simulasi)</p>
              <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 text-center">
                <span><strong className="text-slate-600 dark:text-slate-300">Admin:</strong> admin@tameng.id</span>
                <span><strong className="text-slate-600 dark:text-slate-300">Satgas:</strong> polri@tameng.id</span>
                <span><strong className="text-slate-600 dark:text-slate-300">Password:</strong> 123456</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
