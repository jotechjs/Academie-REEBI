'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

const PUBLIC_PATHS = ['/login', '/admin/login', '/', '/admin'];

// ─── Hook useAuth ─────────────────────────────────────────────────────────────
// Logique simplifiée :
// 1. Lecture synchrone du localStorage (pas d'await → pas de délai)
// 2. Redirection immédiate si pas de token
// 3. PAS de boucle : dépend uniquement de pathname (stable entre navigations SPA)
// ─────────────────────────────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Côté serveur : pas de localStorage
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // Pages publiques → pas de vérification
    if (isPublicPath) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('reebi_token');
    const storedUser = localStorage.getItem('reebi_user');

    if (!token || !storedUser) {
      // Pas de session → rediriger
      const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
      router.push(loginPath);
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(storedUser);

      // Page admin → vérifier le rôle
      if (pathname.startsWith('/admin') && userData.role !== 'ADMIN') {
        router.push('/admin/login');
        setLoading(false);
        return;
      }

      setUser(userData);
    } catch {
      // JSON corrompu → supprimer et rediriger
      localStorage.removeItem('reebi_token');
      localStorage.removeItem('reebi_user');
      const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
      router.push(loginPath);
    }

    setLoading(false);
  }, [pathname, router]);
  // NOTE: pathname change uniquement à chaque navigation SPA — pas de boucle.

  const logout = useCallback(() => {
    localStorage.removeItem('reebi_token');
    localStorage.removeItem('reebi_user');
    const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
    router.push(loginPath);
  }, [pathname, router]);

  return { user, loading, logout };
}