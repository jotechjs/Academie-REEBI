'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Key, Loader2, ServerIcon } from 'lucide-react';
import api, { warmupBackend } from '@/services/api';

export default function AdminLoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverWarming, setServerWarming] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Authentification...');
  const router = useRouter();
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Warm up le backend dès l'affichage de la page (non bloquant)
  useEffect(() => {
    setServerWarming(true);
    warmupBackend().finally(() => setServerWarming(false));
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLoadingMsg('Authentification...');

    // Message adaptatif si ça prend du temps (cold start)
    msgTimerRef.current = setTimeout(() => {
      setLoadingMsg('Le serveur démarre, encore quelques secondes...');
    }, 5000);

    const attempt = async (): Promise<boolean> => {
      try {
        const response = await api.post('/auth/admin/login', { accessCode });
        const { access_token, user } = response.data;
        localStorage.setItem('reebi_token', access_token);
        localStorage.setItem('reebi_user', JSON.stringify(user));
        router.push('/admin/dashboard');
        return true;
      } catch (err: any) {
        // Si erreur réseau (cold start encore en cours), réessayer 1 fois
        if (!err.response && err.code !== 'ERR_CANCELED') {
          return false; // signale qu'on doit retry
        }
        throw err; // erreur métier → propager
      }
    };

    try {
      const ok = await attempt();
      if (!ok) {
        // Retry unique après 3s
        setLoadingMsg('Reconnexion au serveur...');
        await new Promise(r => setTimeout(r, 3000));
        await attempt();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code d\'accès invalide ou serveur indisponible.');
    } finally {
      setLoading(false);
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Large Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <Image
          src="/logo-REEBI.png"
          alt=""
          width={800}
          height={800}
          className="w-full max-w-[800px] h-auto object-contain invert"
          priority
        />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-REEBI.png"
            alt="REEBI Logo"
            width={120}
            height={120}
            className="h-20 sm:h-28 w-auto object-contain"
            priority
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-white tracking-tight">
          Accès Administrateur
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 font-medium">
          Veuillez saisir le code d'accès sécurisé
        </p>

        {/* Indicateur warm-up discret */}
        {serverWarming && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ServerIcon size={12} className="animate-pulse" />
            <span>Connexion au serveur en cours...</span>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800 py-10 px-4 shadow-2xl sm:rounded-[2rem] sm:px-10 border border-slate-700">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-200 text-sm rounded-2xl text-center font-bold">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="accessCode" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Code d'accès secret
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="accessCode"
                  name="accessCode"
                  type="password"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block w-full pl-12 pr-4 py-4 sm:text-sm border-slate-600 bg-slate-900/50 text-white rounded-2xl outline-none transition-all font-medium placeholder-slate-600"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !accessCode}
                className="w-full flex flex-col justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mb-1" size={20} />
                    <span className="text-[10px] font-medium opacity-80">{loadingMsg}</span>
                  </>
                ) : (
                  'AUTORISER L\'ACCÈS'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
