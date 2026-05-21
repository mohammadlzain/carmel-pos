'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import CashierDashboard from '@/app/components/CashierDashboard';

export default function CashierPage() {
  const router = useRouter();
  const { currentUser, logAction } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!currentUser || currentUser.role !== 'cashier')) {
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

  return <CashierDashboard onLogout={handleLogout} />;
}
