'use client';

import { useState } from 'react';
import { useAppContext } from '@/app/context/AppContext';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const {
    currentUser,
    categories,
    setCategories,
    menuItems,
    setMenuItems,
    tents,
    setTents,
    incomingOrders,
    setIncomingOrders,
    invoiceHistory,
    setInvoiceHistory,
    auditLogs,
    setAuditLogs,
    shift,
    setShift,
    logAction
  } = useAppContext();

  const [newCategoryForm, setNewCategoryForm] = useState({ id: '', nameAr: '', nameEn: '' });
  const [menuForm, setMenuForm] = useState({ id: 0, nameAr: '', nameEn: '', price: 0, category: 'drinks' });
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [customTableCount, setCustomTableCount] = useState(0);
  const [showBossMenu, setShowBossMenu] = useState(true);

  const totalSalesRevenue = invoiceHistory.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryForm.id || !newCategoryForm.nameAr || !newCategoryForm.nameEn) return;
    setCategories([...categories, newCategoryForm]);
    logAction(currentUser?.name || '', "إضافة تصنيف منيو", `تم إنشاء تصنيف: ${newCategoryForm.nameAr}`, "📁");
    setNewCategoryForm({ id: '', nameAr: '', nameEn: '' });
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا التصنيف؟ سيتم تلقائياً حذف جميع الوجبات التابعة له من المنيو!")) {
      setCategories(categories.filter(c => c.id !== catId));
      setMenuItems(menuItems.filter(m => m.category !== catId));
      logAction(currentUser?.name || '', "حذف تصنيف منيو", `تم حذف التصنيف كود: ${catId}`, "🗑️");
    }
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingMenu) {
      setMenuItems(menuItems.map(item => item.id === menuForm.id ? { ...menuForm } : item));
      logAction(currentUser?.name || '', "تعديل صنف منيو", `تعديل صنف: ${menuForm.nameAr}`, "✏️");
    } else {
      const newId = Date.now();
      setMenuItems([...menuItems, { ...menuForm, id: newId }]);
      logAction(currentUser?.name || '', "إضافة صنف منيو", `إضافة صنف جديد: ${menuForm.nameAr}`, "🍽️");
    }
    setMenuForm({ id: 0, nameAr: '', nameEn: '', price: 0, category: 'drinks' });
    setIsEditingMenu(false);
  };

  const addExternalTable = () => {
    const nextNum = customTableCount + 1;
    setCustomTableCount(nextNum);
    const newTable = {
      id: `طاولة خارجية ${nextNum}`,
      displayId: `خارجية ${nextNum}`,
      type: 'table' as const,
      status: 'empty' as const,
      waiter: ''
    };
    setTents([...tents, newTable]);
    logAction(currentUser?.name || '', "إضافة موقع جديد", `تم إنشاء طاولة خارجية رقم ${nextNum}`, "➕");
  };

  const deleteTablePermanently = (id: string) => {
    if (confirm(`هل أنت متأكد من حذف وإزالة ${id} تماماً من النظام؟`)) {
      setTents(tents.filter(t => t.id !== id));
      setIncomingOrders(incomingOrders.filter(o => o.tableId !== id));
      logAction(currentUser?.name || '', "حذف موقع", `تم إزالة ${id} نهائياً من النظام`, "❌");
    }
  };

  const resetDayForBoss = () => {
    if (!confirm('هل أنت متأكد من تصفير المبيعات وسجل النشاط؟ هذه العملية ستمسح الطلبات والفواتير والسجل الحالي.')) return;

    setIncomingOrders([]);
    setInvoiceHistory([]);
    setAuditLogs([]);
    setShift({
      isOpen: false,
      openedBy: '',
      openingCash: 0,
      expectedCash: 0,
      closedCash: 0,
      discrepancy: 0,
      status: 'closed'
    });
    setTents(tents.map(t => ({ ...t, status: 'empty' as const, waiter: '' })));
    logAction(currentUser?.name || '', 'تصفير نهاية اليوم', 'تم تصفير المبيعات والطلبات وسجل النشاط لليوم الجديد', '🧹');
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col text-right text-black antialiased font-sans" dir="rtl">
      {/* الهيدر */}
      <header className="bg-emerald-800 text-white shadow-md px-6 py-4 flex justify-between items-center print:hidden">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className="text-xl font-black tracking-wide">مزرعة كرمل <span className="text-xs font-normal text-emerald-200">Carmel Farm POS</span></h1>
          <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${shift.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            الصندوق: {shift.isOpen ? 'مفتوح للعمليات' : 'مغلق بالكامل'}
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="text-sm bg-emerald-700 px-3 py-1.5 rounded-lg font-bold shadow-inner">👤 {currentUser?.name}</span>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">خروج</button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
          <h2 className="text-md font-black text-gray-800 flex items-center gap-2">📊 شاشة الرقابة الإدارية والتحكم الشامل</h2>

          {/* الإحصائيات */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <span className="text-xs text-emerald-800 block font-bold mb-1">مبيعات اليوم المحققة</span>
              <strong className="text-2xl font-black text-emerald-950">{totalSalesRevenue.toFixed(2)} ₪</strong>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <span className="text-xs text-blue-800 block font-bold mb-1">الرصيد الفعلي المتوقع بالدرج</span>
              <strong className="text-2xl font-black text-blue-950">{shift.expectedCash.toFixed(2)} ₪</strong>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <span className="text-xs text-amber-800 block font-bold mb-1">حالة صندوق الكاشير</span>
              <strong className="text-md font-bold text-amber-950">{shift.isOpen ? `مفتوح بعهدة ${shift.openingCash} ₪` : "مغلق"}</strong>
            </div>
          </div>

          {/* زر التصفير */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={resetDayForBoss} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-colors">
              🧹 تصفير اليوم وسجل النشاط
            </button>
            <p className="text-[11px] text-gray-500">يمكن للبوس تصفير الطلبات والمبيعات وسجل النشاط بنهاية اليوم.</p>
          </div>

          {/* إدارة الأقسام */}
          <div className="border-t pt-4">
            <h4 className="text-xs font-bold text-red-800 mb-2">📁 إدارة تصنيفات المنيو</h4>
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3 bg-red-50/50 p-3 rounded-xl">
              <input type="text" placeholder="كود القسم" required value={newCategoryForm.id} onChange={(e) => setNewCategoryForm({...newCategoryForm, id: e.target.value})} className="p-2 border rounded-lg text-xs bg-white text-black outline-none" />
              <input type="text" placeholder="الاسم بالعربية" required value={newCategoryForm.nameAr} onChange={(e) => setNewCategoryForm({...newCategoryForm, nameAr: e.target.value})} className="p-2 border rounded-lg text-xs bg-white text-black outline-none" />
              <input type="text" placeholder="English Name" required value={newCategoryForm.nameEn} onChange={(e) => setNewCategoryForm({...newCategoryForm, nameEn: e.target.value})} className="p-2 border rounded-lg text-xs bg-white text-black outline-none" />
              <button type="submit" className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg py-2 transition-colors">إضافة</button>
            </form>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <div key={c.id} className="bg-gray-50 border rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs shadow-sm">
                  <span><strong>{c.nameAr}</strong></span>
                  <button type="button" onClick={() => handleDeleteCategory(c.id)} className="text-red-600 font-bold hover:text-red-900">❌</button>
                </div>
              ))}
            </div>
          </div>

          {/* إدارة المنيو */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-gray-800">🍽️ إدارة أصناف المنيو</h4>
              <button type="button" onClick={() => setShowBossMenu(!showBossMenu)} className="text-[11px] px-3 py-1 rounded-full bg-emerald-700 text-white font-bold hover:bg-emerald-800">
                {showBossMenu ? 'إخفاء' : 'عرض'}
              </button>
            </div>
            <form onSubmit={handleSaveMenu} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl mb-3">
              <input type="text" placeholder="اسم الصنف بالعربية" required value={menuForm.nameAr} onChange={(e) => setMenuForm({...menuForm, nameAr: e.target.value})} className="p-2 text-xs border rounded-lg bg-white text-black outline-none" />
              <input type="text" placeholder="English" required value={menuForm.nameEn} onChange={(e) => setMenuForm({...menuForm, nameEn: e.target.value})} className="p-2 text-xs border rounded-lg bg-white text-black outline-none" />
              <input type="number" step="0.01" placeholder="السعر" required value={menuForm.price || ''} onChange={(e) => setMenuForm({...menuForm, price: parseFloat(e.target.value)})} className="p-2 text-xs border rounded-lg bg-white text-black outline-none" />
              <select value={menuForm.category} onChange={(e) => setMenuForm({...menuForm, category: e.target.value})} className="p-2 text-xs border rounded-lg bg-white text-black outline-none">
                {categories.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
              <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg py-2 transition-colors">
                {isEditingMenu ? "تحديث" : "إضافة"}
              </button>
            </form>
            {showBossMenu && (
              <div className="bg-gray-50 border rounded-xl p-3 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {menuItems.map(item => (
                    <div key={item.id} className="border rounded-lg p-2 bg-white text-[11px]">
                      <div className="font-bold">{item.nameAr}</div>
                      <div className="text-emerald-700 font-black">{item.price} ₪</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* سجل النشاط */}
          <div className="border-t pt-4">
            <h4 className="text-xs font-bold text-gray-700 mb-2">🕵️‍♂️ سجل النشاط</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-gray-400">لا توجد حركات مسجلة</p>
              ) : (
                auditLogs.slice(0, 20).map(log => (
                  <div key={log.id} className="bg-gray-50 p-2 border rounded-lg text-xs">
                    <div className="flex justify-between">
                      <strong>{log.user}</strong>
                      <span className="text-gray-400 text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-emerald-800 font-semibold text-[11px]">{log.action}</p>
                    <p className="text-gray-600 text-[10px]">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* إدارة الطاولات */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-gray-700">🪑 إدارة الطاولات والخيام</h4>
              <button type="button" onClick={addExternalTable} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-lg">
                ➕ إضافة طاولة
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {tents.map(tent => (
                <div key={tent.id} className="relative">
                  <div className="p-2 border rounded-lg text-center text-xs bg-gray-50">
                    <div className="font-bold truncate">{tent.displayId}</div>
                    {currentUser?.role === 'boss' && (
                      <button type="button" onClick={() => deleteTablePermanently(tent.id)} className="text-red-600 text-[10px] font-bold hover:text-red-800">
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
