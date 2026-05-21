'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import AdminDashboard from '@/app/components/AdminDashboard';

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, logAction } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!currentUser || currentUser.role !== 'boss')) {
      router.push('/login');
    }
  }, [currentUser, mounted, router]);

  if (!mounted || !currentUser) {
    return null;
  }

  const handleLogout = () => {
    logAction(currentUser.name, "تسجيل خروج", "تم الخروج من النظام الموحد", "🔒");
    router.push('/login');
  };

  return <AdminDashboard onLogout={handleLogout} />;
}
