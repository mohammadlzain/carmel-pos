'use client';

import { useState } from 'react';
import { useAppContext } from '@/app/context/AppContext';

interface CashierDashboardProps {
  onLogout: () => void;
}

export default function CashierDashboard({ onLogout }: CashierDashboardProps) {
  const {
    currentUser,
    shift,
    setShift,
    incomingOrders,
    setIncomingOrders,
    menuItems,
    invoiceHistory,
    setInvoiceHistory,
    logAction
  } = useAppContext();

  const [shiftInputAmount, setShiftInputAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'none' | 'amount' | 'percent'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [selectedTentId, setSelectedTentId] = useState<string | null>(null);

  const currentTableOrders = selectedTentId ? incomingOrders.filter(o => o.tableId === selectedTentId) : [];

  let currentSubtotal = 0;
  currentTableOrders.forEach(o => {
    o.items.forEach((oi: any) => {
      const mItem = menuItems.find(m => m.id === oi.menuId);
      if (mItem) currentSubtotal += mItem.price * oi.qty;
    });
  });

  let currentDiscountAmount = 0;
  if (discountType === 'amount') {
    currentDiscountAmount = discountValue;
  } else if (discountType === 'percent') {
    currentDiscountAmount = currentSubtotal * (discountValue / 100);
  }
  if (currentDiscountAmount > currentSubtotal) currentDiscountAmount = currentSubtotal;

  const subtotalAfterDiscount = currentSubtotal - currentDiscountAmount;
  const currentTax = subtotalAfterDiscount * 0.10;
  const currentTotal = subtotalAfterDiscount + currentTax;

  const handleOpenShift = () => {
    if (shiftInputAmount < 0) return;
    setShift({
      isOpen: true,
      openedBy: currentUser?.name || '',
      openingCash: shiftInputAmount,
      expectedCash: shiftInputAmount,
      closedCash: 0,
      discrepancy: 0,
      status: 'open'
    });
    logAction(currentUser?.name || '', "فتح الكاش", `رأس مال: ${shiftInputAmount} ₪`, "💰");
    setShiftInputAmount(0);
  };

  const handleCloseShift = () => {
    const diff = shiftInputAmount - shift.expectedCash;
    setShift(prev => ({
      ...prev,
      isOpen: false,
      closedCash: shiftInputAmount,
      discrepancy: diff,
      status: 'closed'
    }));
    logAction(currentUser?.name || '', "إغلاق الكاش", `المبلغ الفعلي: ${shiftInputAmount} ₪`, "🛑");
    setShiftInputAmount(0);
  };

  const handlePaymentAndPrint = () => {
    if (!selectedTentId || currentTableOrders.length === 0) return;

    const invNumber = Math.floor(100000 + Math.random() * 900000);
    const completedInvoice = {
      id: invNumber,
      tableId: selectedTentId,
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      subtotal: currentSubtotal,
      discount: currentDiscountAmount,
      tax: currentTax,
      totalAmount: currentTotal
    };

    setInvoiceHistory(prev => [completedInvoice, ...prev]);
    setShift(prev => ({ ...prev, expectedCash: prev.expectedCash + currentTotal }));
    logAction(currentUser?.name || '', "إصدار فاتورة", `الموقع: ${selectedTentId} | المبلغ: ${currentTotal.toFixed(2)} ₪`, "🧾");

    setTimeout(() => {
      window.print();
      setIncomingOrders(prev => prev.filter(o => o.tableId !== selectedTentId));
      setSelectedTentId(null);
      setDiscountType('none');
      setDiscountValue(0);
    }, 300);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col text-right text-black antialiased font-sans" dir="rtl">
      {/* الهيدر */}
      <header className="bg-emerald-800 text-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-wide">مزرعة كرمل</h1>
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="text-sm bg-emerald-700 px-3 py-1.5 rounded-lg font-bold">👤 {currentUser?.name}</span>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">خروج</button>
        </div>
      </header>

      {/* المحتوى */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* إدارة الوردية */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            <h3 className="text-md font-bold text-gray-800">🪙 إدارة صندوق النقد</h3>
            
            {!shift.isOpen ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-red-50 p-4 rounded-xl border border-red-200">
                <p className="text-xs text-red-800 font-bold flex-1">⚠️ الوردية مغلقة. أدخل عهدة الدرج:</p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input type="number" placeholder="المبلغ" value={shiftInputAmount || ''} onChange={(e) => setShiftInputAmount(parseFloat(e.target.value))} className="p-2 border rounded-lg text-xs bg-white text-black w-32 outline-none font-bold text-center" />
                  <button type="button" onClick={handleOpenShift} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">فتح الصندوق</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-green-50 p-4 rounded-xl border border-green-200 gap-3">
                <div className="text-xs text-green-800 font-bold">
                  🟢 الوردية نشطة | الرصيد المتوقع: <strong className="text-green-950">{shift.expectedCash.toFixed(2)} ₪</strong>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input type="number" placeholder="الجرد الفعلي" value={shiftInputAmount || ''} onChange={(e) => setShiftInputAmount(parseFloat(e.target.value))} className="p-2 border rounded-lg text-xs bg-white text-black w-40 outline-none text-center font-bold" />
                  <button type="button" onClick={handleCloseShift} className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">إغلاق</button>
                </div>
              </div>
            )}
          </div>

          {/* عرض الطلبات والحسابات */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-md font-bold text-gray-800 mb-4">📋 الطلبات الحية</h3>
            {incomingOrders.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">لا توجد طلبات معلقة</p>
            ) : (
              <div className="space-y-3">
                {incomingOrders.map((order) => (
                  <div key={order.id} className="p-3 border rounded-xl bg-amber-50 border-amber-200">
                    <div className="flex justify-between items-center mb-2">
                      <strong className="text-sm">{order.tableId}</strong>
                      <span className="text-[11px] text-gray-500">{order.timestamp}</span>
                    </div>
                    <div className="text-xs text-gray-700 mb-2">
                      {order.items.map((item, idx) => {
                        const m = menuItems.find(mi => mi.id === item.menuId);
                        return <div key={idx}>✓ {m?.nameAr} × {item.qty}</div>;
                      })}
                    </div>
                    <button type="button" onClick={() => { setSelectedTentId(order.tableId); }} className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded-lg font-bold transition-colors">
                      اختيار للفاتورة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* الفاتورة */}
          {selectedTentId && (
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
              <h3 className="text-md font-bold text-gray-800">🧾 الفاتورة: {selectedTentId}</h3>

              {/* الخصومات */}
              <div className="bg-amber-50 p-3 border border-amber-200 rounded-xl">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button type="button" onClick={() => { setDiscountType('none'); setDiscountValue(0); }} className={`p-1 rounded text-[10px] font-bold ${discountType === 'none' ? 'bg-amber-800 text-white' : 'bg-white border border-amber-300 text-amber-900'}`}>بلا</button>
                  <button type="button" onClick={() => { setDiscountType('amount'); }} className={`p-1 rounded text-[10px] font-bold ${discountType === 'amount' ? 'bg-amber-800 text-white' : 'bg-white border border-amber-300 text-amber-900'}`}>مبلغ</button>
                  <button type="button" onClick={() => { setDiscountType('percent'); }} className={`p-1 rounded text-[10px] font-bold ${discountType === 'percent' ? 'bg-amber-800 text-white' : 'bg-white border border-amber-300 text-amber-900'}`}>نسبة</button>
                </div>
                {discountType !== 'none' && (
                  <input type="number" min="0" value={discountValue || ''} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className="w-full p-1 border rounded text-xs text-center font-bold bg-white text-black outline-none" placeholder="0" />
                )}
              </div>

              {/* الملخص المالي */}
              <div className="border-t pt-3 space-y-1 text-xs font-medium">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span>{currentSubtotal.toFixed(2)} ₪</span>
                </div>
                {currentDiscountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>الخصم:</span>
                    <span>-{currentDiscountAmount.toFixed(2)} ₪</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>الضريبة (10%):</span>
                  <span>{currentTax.toFixed(2)} ₪</span>
                </div>
                <div className="flex justify-between text-lg font-black text-emerald-800 border-t pt-2 border-dashed">
                  <span>الإجمالي:</span>
                  <span>{currentTotal.toFixed(2)} ₪</span>
                </div>
              </div>

              <button type="button" onClick={handlePaymentAndPrint} disabled={!shift.isOpen} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 rounded-xl disabled:opacity-40 text-xs transition-all">
                🧾 قبض الحساب وطباعة الفاتورة
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
