'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import ServiceDashboard from '@/app/components/ServiceDashboard';

export default function ServicePage() {
  const router = useRouter();
  const { currentUser, logAction } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!currentUser || currentUser.role !== 'service')) {
      router.push('/login');
    }
  }, [currentUser, mounted, router]);

  if (!mounted || !currentUser) {
    return null;
  }

  const handleLogout = () => {
    logAction(currentUser.name, "تسجيل خروج", "تم الخروج من النظام", "🔒");
    router.push('/login');
  };

  return <ServiceDashboard onLogout={handleLogout} />;
}
