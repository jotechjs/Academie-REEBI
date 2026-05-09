import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('reebi_token') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('reebi_user') : null;

    // Determine correct login path based on current URL
    const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';

    if (!token || !storedUser) {
      if (pathname !== loginPath && pathname !== '/' && pathname !== '/admin') {
        router.push(loginPath);
      }
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);

      // Basic Role Protection
      if (pathname.startsWith('/admin') && userData.role !== 'ADMIN' && pathname !== '/admin/login') {
        router.push('/login');
      }
    } catch (e) {
      localStorage.removeItem('reebi_token');
      localStorage.removeItem('reebi_user');
      router.push(loginPath);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [router, pathname]);

  const logout = () => {
    const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
    localStorage.removeItem('reebi_token');
    localStorage.removeItem('reebi_user');
    router.push(loginPath);
  };

  return { user, loading, logout };
}