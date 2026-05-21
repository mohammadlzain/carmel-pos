'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/app/context/AppContext';

interface ServiceDashboardProps {
  onLogout: () => void;
}

export default function ServiceDashboard({ onLogout }: ServiceDashboardProps) {
  const {
    currentUser,
    categories,
    menuItems,
    tents,
    setTents,
    serviceCart: initialCart,
    setServiceCart: setInitialCart,
    incomingOrders,
    setIncomingOrders,
    shift,
    logAction
  } = useAppContext();

  const [serviceCart, setServiceCart] = useState(initialCart);
  const [selectedTentId, setSelectedTentId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isDispatching, setIsDispatching] = useState(false);

  // تحديث الـ cart من Context
  useEffect(() => {
    setServiceCart(initialCart);
  }, [initialCart]);

  // حفظ الـ cart في Context
  useEffect(() => {
    setInitialCart(serviceCart);
  }, [serviceCart, setInitialCart]);

  const playIncomingOrderSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(720, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.18);
      oscillator.onended = () => {
        audioCtx.close();
      };
    } catch (e) {
      console.log("Audio play blocked", e);
    }
  };

  const addItemToServiceCart = (menuId: number) => {
    if (!shift.isOpen) {
      alert("⚠️ الوردية مغلقة!");
      return;
    }
    if (!selectedTentId) {
      alert("⚠️ اختر الخيمة أولاً!");
      return;
    }
    setServiceCart(prev => {
      const existing = prev.find(i => i.menuId === menuId);
      if (existing) {
        return prev.map(i => i.menuId === menuId ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { menuId, qty: 1 }];
    });
  };

  const adjustCartQty = (menuId: number, change: number) => {
    setServiceCart(prev => prev.map(i => i.menuId === menuId ? { ...i, qty: i.qty + change } : i).filter(i => i.qty > 0));
  };

  const dispatchOrderToCashier = () => {
    if (serviceCart.length === 0 || !selectedTentId) return;
    if (isDispatching) return;

    setIsDispatching(true);
    try {
      const orderId = Math.floor(100 + Math.random() * 900);
      const newOrderPayload = {
        id: orderId,
        tableId: selectedTentId,
        waiter: currentUser?.name || '',
        timestamp: new Date().toLocaleTimeString('ar-EG'),
        items: [...serviceCart],
        isDone: false
      };

      setIncomingOrders(prev => [...prev, newOrderPayload]);
      setTents(prev => prev.map(t => t.id === selectedTentId ? { ...t, status: 'occupied' as const, waiter: currentUser?.name || '' } : t));
      logAction(currentUser?.name || '', "إرسال طلب", `طلب #${orderId} لـ ${selectedTentId}`, "🚀");
      
      playIncomingOrderSound();
      setServiceCart([]);
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredMenu = activeCategory === 'all' ? menuItems : menuItems.filter(m => m.category === activeCategory);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col text-right text-black antialiased font-sans" dir="rtl">
      {/* الهيدر */}
      <header className="bg-emerald-800 text-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-wide">مزرعة كرمل</h1>
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="text-sm bg-emerald-700 px-3 py-1.5 rounded-lg font-bold">👤 {currentUser?.name}</span>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">خروج</button>
        </div>
      </header>

      {/* المحتوى */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* قائمة الطعام */}
          <div className="lg:col-span-3 space-y-4">
            {/* اختيار الخيمة */}
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h3 className="text-xs font-bold text-gray-800 mb-3">🏕️ اختر الموقع</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {tents.map(tent => (
                  <button
                    key={tent.id}
                    onClick={() => setSelectedTentId(tent.id)}
                    className={`p-2 rounded-lg text-xs font-bold transition-all ${
                      selectedTentId === tent.id
                        ? 'bg-emerald-700 text-white ring-2 ring-emerald-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tent.displayId}
                  </button>
                ))}
              </div>
            </div>

            {/* الأصناف */}
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h3 className="text-xs font-bold text-gray-800 mb-3">🍽️ الأصناف</h3>
              
              {/* تصنيفات */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button type="button" onClick={() => setActiveCategory('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${activeCategory === 'all' ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-600'}`}>الكل</button>
                {categories.map(c => (
                  <button type="button" key={c.id} onClick={() => setActiveCategory(c.id)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${activeCategory === c.id ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-600'}`}>{c.nameAr}</button>
                ))}
              </div>

              {/* شبكة الأصناف */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredMenu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addItemToServiceCart(item.id)}
                    className="p-3 border rounded-lg bg-white hover:border-emerald-700 hover:shadow-md transition-all text-right"
                  >
                    <div className="font-bold text-xs text-gray-800 truncate">{item.nameAr}</div>
                    <div className="text-emerald-700 font-black text-sm">{item.price} ₪</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* السلة */}
          <div className="bg-white rounded-xl shadow-sm border flex flex-col h-[calc(100vh-200px)] overflow-hidden">
            <div className="p-4 bg-blue-50 border-b">
              <h3 className="text-xs font-bold text-blue-900">📝 السلة</h3>
              <p className="text-[10px] text-gray-600 mt-1">{selectedTentId || 'اختر موقع'}</p>
            </div>

            {/* محتوى السلة */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {serviceCart.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">السلة فارغة</p>
              ) : (
                serviceCart.map(item => {
                  const m = menuItems.find(mi => mi.id === item.menuId);
                  return (
                    <div key={item.menuId} className="flex justify-between items-center bg-gray-50 p-2 rounded border text-[11px]">
                      <span className="font-bold text-gray-800 truncate flex-1">{m?.nameAr}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => adjustCartQty(item.menuId, -1)} className="w-5 h-5 bg-gray-200 rounded text-xs font-bold">-</button>
                        <span className="px-1 font-bold text-blue-900">{item.qty}</span>
                        <button type="button" onClick={() => adjustCartQty(item.menuId, 1)} className="w-5 h-5 bg-gray-200 rounded text-xs font-bold">+</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* زر الإرسال */}
            <div className="p-3 border-t bg-blue-50">
              <button
                type="button"
                onClick={dispatchOrderToCashier}
                disabled={serviceCart.length === 0 || !selectedTentId || isDispatching}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs disabled:opacity-40 transition-all"
              >
                {isDispatching ? '⏳ جاري...' : '🚀 إرسال الطلب'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
