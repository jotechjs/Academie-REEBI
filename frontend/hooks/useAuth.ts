import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
  const isAuthCheckedRef = useRef(false);
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    if (isAuthCheckedRef.current && lastPathRef.current === pathname) {
      return;
    }
    isAuthCheckedRef.current = true;
    lastPathRef.current = pathname;

    const checkAuth = () => {
      try {
        const token = localStorage.getItem('reebi_token');
        const storedUser = localStorage.getItem('reebi_user');
        const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';

        if (!token || !storedUser) {
          if (pathname !== loginPath && pathname !== '/' && pathname !== '/admin') {
            router.push(loginPath);
          }
          setLoading(false);
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        if (pathname.startsWith('/admin') && userData.role !== 'ADMIN' && pathname !== '/admin/login') {
          router.push('/login');
        }
      } catch (e) {
        localStorage.removeItem('reebi_token');
        localStorage.removeItem('reebi_user');
        const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
        router.push(loginPath);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const logout = () => {
    const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
    localStorage.removeItem('reebi_token');
    localStorage.removeItem('reebi_user');
    isAuthCheckedRef.current = false;
    router.push(loginPath);
  };

  return { user, loading, logout };
}