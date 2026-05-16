'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

const PUBLIC_PATHS = ['/login', '/admin/login', '/', '/admin'];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const authChecked = useRef(false);
  const isRedirecting = useRef(false);

  const checkAuth = useCallback(() => {
    if (isRedirecting.current) {
      return;
    }

    const isAdminPath = pathname.startsWith('/admin');
    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (isPublicPath) {
      setLoading(false);
      authChecked.current = true;
      return;
    }

    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('reebi_token');
    const storedUser = localStorage.getItem('reebi_user');

    if (!token || !storedUser) {
      isRedirecting.current = true;
      const loginPath = isAdminPath ? '/admin/login' : '/login';
      router.push(loginPath);
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(storedUser);

      if (isAdminPath && userData.role !== 'ADMIN') {
        isRedirecting.current = true;
        const loginPath = '/admin/login';
        router.push(loginPath);
        setLoading(false);
        return;
      }

      setUser(userData);
      authChecked.current = true;
    } catch {
      localStorage.removeItem('reebi_token');
      localStorage.removeItem('reebi_user');
      isRedirecting.current = true;
      const loginPath = isAdminPath ? '/admin/login' : '/login';
      router.push(loginPath);
    }

    setLoading(false);
  }, [pathname, router]);

  useEffect(() => {
    isRedirecting.current = false;

    if (authChecked.current) {
      const currentPath = pathname;
      const isCurrentAdminPath = currentPath.startsWith('/admin');
      const isCurrentPublicPath = PUBLIC_PATHS.includes(currentPath);

      if (!isCurrentAdminPath || isCurrentPublicPath) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('reebi_token');
      const storedUser = localStorage.getItem('reebi_user');

      if (!token || !storedUser) {
        isRedirecting.current = true;
        router.push('/admin/login');
        setLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        if (userData.role !== 'ADMIN') {
          isRedirecting.current = true;
          router.push('/admin/login');
          setLoading(false);
          return;
        }
        setUser(userData);
      } catch {
        isRedirecting.current = true;
        router.push('/admin/login');
      }
      setLoading(false);
      return;
    }

    checkAuth();
  }, [pathname, router, checkAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem('reebi_token');
    localStorage.removeItem('reebi_user');
    authChecked.current = false;
    isRedirecting.current = false;
    const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
    router.push(loginPath);
  }, [pathname, router]);

  return { user, loading, logout };
}