'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Key, Loader2, ServerIcon } from 'lucide-react';
import api, { warmupBackend } from '@/services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [identifiant, setIdentifiant] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverWarming, setServerWarming] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Connexion en cours...');
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
    setLoadingMsg('Connexion en cours...');

    // Message adaptatif si ça prend du temps (cold start)
    msgTimerRef.current = setTimeout(() => {
      setLoadingMsg('Le serveur démarre, encore quelques secondes...');
    }, 5000);

    const attempt = async (): Promise<boolean> => {
      try {
        const response = await api.post('/auth/login', { email, identifiant });
        const { access_token, user } = response.data;
        localStorage.setItem('reebi_token', access_token);
        localStorage.setItem('reebi_user', JSON.stringify(user));
        router.push('/learner/dashboard');
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
        // Retry unique après 3s (le serveur finit de démarrer)
        setLoadingMsg('Reconnexion au serveur...');
        await new Promise(r => setTimeout(r, 3000));
        await attempt();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants invalides ou serveur indisponible.');
    } finally {
      setLoading(false);
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Large Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <Image
          src="/logo-REEBI.png"
          alt=""
          width={800}
          height={800}
          className="w-full max-w-[800px] h-auto object-contain"
          priority
        />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Image
            src="/logo-REEBI.png"
            alt="REEBI Logo"
            width={96}
            height={96}
            className="h-16 sm:h-24 w-auto object-contain"
            priority
          />
        </div>
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Académie REEBI
        </h2>
        <p className="mt-1 sm:mt-2 text-center text-xs sm:text-sm text-slate-500 font-medium px-2">
          Connectez-vous à votre espace personnel
        </p>

        {/* Indicateur warm-up discret */}
        {serverWarming && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ServerIcon size={12} className="animate-pulse" />
            <span>Connexion au serveur en cours...</span>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-0 sm:px-0">
        <div className="bg-white/80 backdrop-blur-sm py-8 sm:py-10 px-4 sm:px-10 shadow-2xl shadow-slate-200 sm:rounded-[2rem] border border-white">
          <form className="space-y-5 sm:space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-100 text-red-600 text-xs sm:text-sm rounded-2xl text-center font-bold">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Adresse Email
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm border-slate-100 bg-slate-50/50 rounded-2xl outline-none transition-all font-medium min-h-touch"
                  placeholder="votre.email@exemple.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="identifiant" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Code Identifiant
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Key className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400" />
                </div>
                <input
                  id="identifiant"
                  name="identifiant"
                  type="text"
                  required
                  value={identifiant}
                  onChange={(e) => setIdentifiant(e.target.value)}
                  className="focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm border-slate-100 bg-slate-50/50 rounded-2xl outline-none transition-all font-medium min-h-touch"
                  placeholder="Entrez votre code REEBI"
                />
              </div>
            </div>

            <div className="pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex flex-col justify-center items-center py-3 sm:py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-blue-500/20 text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98] disabled:opacity-50 min-h-touch"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mb-1" size={20} />
                    <span className="text-[10px] font-medium opacity-80">{loadingMsg}</span>
                  </>
                ) : (
                  'SE CONNECTER AU DASHBOARD'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
