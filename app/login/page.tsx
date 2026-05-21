'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';

const usersDatabase = [
  { id: 1, username: "Boss", password: "551", role: "boss" as const, name: "المدير العام" },
  { id: 2, username: "Cashier", password: "453", role: "cashier" as const, name: "كاشير الصالة" },
  { id: 3, username: "Service", password: "123", role: "service" as const, name: "مضيف الميدان" }
];

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, logAction } = useAppContext();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = usersDatabase.find(
      u => u.username.toLowerCase() === loginForm.username.toLowerCase() && u.password === loginForm.password
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      logAction(foundUser.name, "تسجيل دخول", `بصلاحية ${foundUser.role.toUpperCase()}`, "⚡");
      setLoginError('');

      // إعادة التوجيه حسب الدور
      if (foundUser.role === 'boss') {
        router.push('/admin');
      } else if (foundUser.role === 'cashier') {
        router.push('/cashier');
      } else if (foundUser.role === 'service') {
        router.push('/service');
      }
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-900 to-emerald-950 min-h-screen flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-emerald-800 tracking-tight">مزرعة كرمل</h2>
          <p className="text-xs text-gray-500 font-medium">نظام التصفية، إدارة الورديات والمحاسبة الفورية</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">اسم المستخدم</label>
            <input
              type="text"
              required
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl text-black text-left outline-none font-medium focus:ring-2 focus:ring-emerald-700"
              placeholder="Boss / Cashier / Service"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl text-black text-left outline-none font-medium focus:ring-2 focus:ring-emerald-700"
              placeholder="••••"
            />
          </div>

          {loginError && (
            <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{loginError}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-all shadow-md"
          >
            تسجيل الدخول للنظام
          </button>
        </form>

        <div className="bg-gray-50 p-3 rounded-lg text-[11px] text-gray-600 text-center space-y-1">
          <p className="font-bold">🔐 بيانات الاختبار:</p>
          <p>Boss / 551 | Cashier / 453 | Service / 123</p>
        </div>
      </div>
    </div>
  );
}
