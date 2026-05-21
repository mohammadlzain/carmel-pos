'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';

export default function Home() {
  const router = useRouter();
  const { currentUser } = useAppContext();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'boss') {
        router.push('/admin');
      } else if (currentUser.role === 'cashier') {
        router.push('/cashier');
      } else if (currentUser.role === 'service') {
        router.push('/service');
      }
    } else {
      router.push('/login');
    }
  }, [currentUser, router]);

  return null;
}


// الحسابات النهائية للنظام مع كلمات المرور المحدثة
const usersDatabase = [
  { id: 1, username: "Boss", password: "551", role: "boss", name: "المدير العام" },
  { id: 2, username: "Cashier", password: "453", role: "cashier", name: "كاشير الصالة" },
  { id: 3, username: "Service", password: "123", role: "service", name: "مضيف الميدان" }
];

export default function KarmelUltimatePOS() {
  // --- الولايات البرمجية (States) ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  // نظام الأقسام والمنيو
  const [categories, setCategories] = useState([
    { id: 'drinks', nameAr: 'مشروبات', nameEn: 'Drinks' },
    { id: 'meals', nameAr: 'وجبات ومشاوي', nameEn: 'Meals & Grills' },
    { id: 'hookah', nameAr: 'أراجيل', nameEn: 'Hookah' }
  ]);
  const [newCategoryForm, setNewCategoryForm] = useState({ id: '', nameAr: '', nameEn: '' });

  const [menuItems, setMenuItems] = useState([
    { id: 1, nameAr: "قهوة عربية (دلة)", nameEn: "Arabic Coffee (Dallah)", price: 25, category: "drinks" },
    { id: 2, nameAr: "شاي مرمية بلدية", nameEn: "Local Sage Tea", price: 7, category: "drinks" },
    { id: 3, nameAr: "كيلو مشاوي مشكل", nameEn: "1KG Mixed Grill", price: 140, category: "meals" },
    { id: 7, nameAr: "أرجيلة تفاحتين فاخر", nameEn: "Premium Double Apple Hookah", price: 30, category: "hookah" }
  ]);
  
  const [tents, setTents] = useState<any[]>([]);
  const [customTableCount, setCustomTableCount] = useState(0);
  const [selectedTentId, setSelectedTentId] = useState<any>(null);
  
  // سلة الميدان المؤقتة (خاصة بالسيرفيس فقط)
  const [serviceCart, setServiceCart] = useState<any[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [showBossMenu, setShowBossMenu] = useState(true);

  // طابور الطلبات المركزي المرسل للكاشير
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);

  // نظام الخصومات (خاص بالكاشير)
  const [discountType, setDiscountType] = useState<'none' | 'amount' | 'percent'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // نظام الورديات
  const [shift, setShift] = useState({
    isOpen: false,
    openedBy: '',
    openingCash: 0,
    expectedCash: 0,
    closedCash: 0,
    discrepancy: 0,
    status: 'closed'
  });
  const [shiftInputAmount, setShiftInputAmount] = useState<number>(0);

  // السجلات والتقارير وفواتير اليوم
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);

  // نموذج المنيو للمدير
  const [menuForm, setMenuForm] = useState({ id: 0, nameAr: '', nameEn: '', price: 0, category: 'drinks' });
  const [isEditingMenu, setIsEditingMenu] = useState(false);

  // النقل والتحويل بين الطاولات
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState('all');

  // توليد الخيام الافتراضية الـ 20 عند التشغيل
  useEffect(() => {
    const initialTents = [];
    for (let i = 1; i <= 20; i++) {
      initialTents.push({
        id: `خيمة ${i}`,
        displayId: i,
        type: 'tent',
        status: 'empty',
        waiter: ''
      });
    }
    setTents(initialTents);
  }, []);

  // دالة تنبيه صوتي عند إرسال طلب الميدان من السيرفس
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
      console.log("Audio play blocked by browser settings", e);
    }
  };

  // --- نظام الدخول والصلاحيات ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = usersDatabase.find(
      u => u.username.toLowerCase() === loginForm.username.toLowerCase() && u.password === loginForm.password
    );
    if (foundUser) {
      setCurrentUser(foundUser);
      setLoginError('');
      logAction(foundUser.name, "تسجيل دخول", `بصلاحية ${foundUser.role.toUpperCase()}`, "⚡");
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    logAction(currentUser?.name, "تسجيل خروج", "تم الخروج من النظام الموحد", "🔒");
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
    setSelectedTentId(null);
    setServiceCart([]);
  };

  const logAction = (user: string, action: string, details: string, icon: string = "📝") => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      user,
      action,
      details,
      icon
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- إداريات الوردية والصندوق ---
  const handleOpenShift = () => {
    if (shiftInputAmount < 0) return;
    setShift({
      isOpen: true,
      openedBy: currentUser.name,
      openingCash: shiftInputAmount,
      expectedCash: shiftInputAmount,
      closedCash: 0,
      discrepancy: 0,
      status: 'open'
    });
    logAction(currentUser.name, "فتح الكاش", `رأس مال افتتاحي: ${shiftInputAmount} ₪`, "💰");
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
    logAction(currentUser.name, "إغلاق الكاش", `المبلغ الفعلي: ${shiftInputAmount} ₪ | الفروقات: ${diff} ₪`, "🛑");
    setShiftInputAmount(0);
  };

  // --- عمليات الميدان والسيرفيس (إدخال الطلبات) ---
  const addItemToServiceCart = (menuId: number) => {
    if (!shift.isOpen) {
      alert("⚠️ لا يمكن إدخال طلبات والوردية مغلقة! يرجى التنسيق مع الكاشير لفتح الصندوق أولاً.");
      return;
    }
    if (!selectedTentId) {
      alert("⚠️ يرجى اختيار الخيمة أو الطاولة أولاً من المخطط!");
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
        waiter: currentUser.name,
        timestamp: new Date().toLocaleTimeString('ar-EG'),
        items: [...serviceCart],
        isDone: false
      };

      setIncomingOrders(prev => [...prev, newOrderPayload]);
      setTents(prev => prev.map(t => t.id === selectedTentId ? { ...t, status: 'occupied', waiter: currentUser.name } : t));
      logAction(currentUser.name, "إرسال طلب للمطبخ", `طلب رقم #${orderId} لـ ${selectedTentId}`, "🚀");
      
      playIncomingOrderSound();
      setServiceCart([]);
    } finally {
      setIsDispatching(false);
    }
  };

  const toggleOrderDone = (id: number) => {
    setIncomingOrders(prev => prev.map(o => o.id === id ? { ...o, isDone: !o.isDone } : o));
  };

  const resetDayForBoss = () => {
    if (currentUser?.role !== 'boss') return;
    if (!confirm('هل أنت متأكد من تصفير المبيعات وسجل النشاط؟ هذه العملية ستمسح الطلبات والفواتير والسجل الحالي.')) return;

    setIncomingOrders([]);
    setInvoiceHistory([]);
    setAuditLogs([]);
    setServiceCart([]);
    setSelectedTentId(null);
    setDiscountType('none');
    setDiscountValue(0);
    setShift({
      isOpen: false,
      openedBy: '',
      openingCash: 0,
      expectedCash: 0,
      closedCash: 0,
      discrepancy: 0,
      status: 'closed'
    });
    setTents(prev => prev.map(t => ({ ...t, status: 'empty', waiter: '' })));
    logAction(currentUser.name, 'تصفير نهاية اليوم', 'تم تصفير المبيعات والطلبات وسجل النشاط لليوم الجديد', '🧹');
  };

  // --- لوحة تحكم المدير العام (Boss Controls) ---
  const addExternalTable = () => {
    const nextNum = customTableCount + 1;
    setCustomTableCount(nextNum);
    const newTable = {
      id: `طاولة خارجية ${nextNum}`,
      displayId: `خارجية ${nextNum}`,
      type: 'table',
      status: 'empty',
      waiter: ''
    };
    setTents(prev => [...prev, newTable]);
    logAction(currentUser.name, "إضافة موقع جديد", `تم إنشاء طاولة خارجية رقم ${nextNum}`, "➕");
  };

  const deleteTablePermanently = (id: string) => {
    if (currentUser.role !== 'boss') return;
    if (confirm(`هل أنت متأكد من حذف وإزالة ${id} تماماً من النظام؟`)) {
      setTents(prev => prev.filter(t => t.id !== id));
      setIncomingOrders(prev => prev.filter(o => o.tableId !== id));
      if (selectedTentId === id) setSelectedTentId(null);
      logAction(currentUser.name, "حذف موقع", `تم إزالة ${id} نهائياً من النظام`, "❌");
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryForm.id || !newCategoryForm.nameAr || !newCategoryForm.nameEn) return;
    setCategories(prev => [...prev, newCategoryForm]);
    logAction(currentUser.name, "إضافة تصنيف منيو", `تم إنشاء تصنيف: ${newCategoryForm.nameAr}`, "📁");
    setNewCategoryForm({ id: '', nameAr: '', nameEn: '' });
  };

  const handleDeleteCategory = (catId: string) => {
    if (currentUser.role !== 'boss') return;
    if (confirm("هل أنت متأكد من حذف هذا التصنيف؟ سيتم تلقائياً حذف جميع الوجبات التابعة له من المنيو!")) {
      setCategories(prev => prev.filter(c => c.id !== catId));
      setMenuItems(prev => prev.filter(m => m.category !== catId));
      logAction(currentUser.name, "حذف تصنيف منيو", `تم حذف التصنيف كود: ${catId}`, "🗑️");
    }
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingMenu) {
      setMenuItems(prev => prev.map(item => item.id === menuForm.id ? { ...menuForm } : item));
      logAction(currentUser.name, "تعديل صنف منيو", `تعديل صنف: ${menuForm.nameAr}`, "✏️");
    } else {
      const newId = Date.now();
      setMenuItems(prev => [...prev, { ...menuForm, id: newId }]);
      logAction(currentUser.name, "إضافة صنف منيو", `إضافة صنف جديد: ${menuForm.nameAr}`, "🍽️");
    }
    setMenuForm({ id: 0, nameAr: '', nameEn: '', price: 0, category: 'drinks' });
    setIsEditingMenu(false);
  };

  const executeTransfer = () => {
    if (!transferFrom || !transferTo) return;
    
    setIncomingOrders(prev => prev.map(o => o.tableId === transferFrom ? { ...o, tableId: transferTo } : o));
    setTents(prev => prev.map(t => {
      if (t.id === transferTo) return { ...t, status: 'occupied' };
      if (t.id === transferFrom) return { ...t, status: 'empty', waiter: '' };
      return t;
    }));

    logAction(currentUser.name, "نقل طلبات الموقع", `من ${transferFrom} إلى ${transferTo}`, "🔄");
    setSelectedTentId(transferTo);
    setIsTransferOpen(false);
    setTransferFrom('');
    setTransferTo('');
  };

  // --- حساب الفواتير والمجاميع الحالية مع الخصم الحسابي ---
  const currentTableOrders = incomingOrders.filter(o => o.tableId === selectedTentId);
  
  let currentSubtotal = 0;
  currentTableOrders.forEach(o => {
    o.items.forEach((oi: any) => {
      const mItem = menuItems.find(m => m.id === oi.menuId);
      if (mItem) currentSubtotal += mItem.price * oi.qty;
    });
  });

  // حساب قيمة الخصم بناءً على النوع المختار
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

  // إغلاق الفاتورة والطباعة الحرارية المباشرة
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
    logAction(currentUser.name, "إصدار فاتورة وتصفية حساب", `موقع: ${selectedTentId} | القيمة المسددة: ${currentTotal.toFixed(2)} ₪`, "🧾");

    // تنفيذ عملية الطباعة الفورية
    setTimeout(() => {
      window.print();
      // تنظيف النظام من طلبات الموقع المصفى وإعادته فارغاً
      setIncomingOrders(prev => prev.filter(o => o.tableId !== selectedTentId));
      setTents(prev => prev.map(t => t.id === selectedTentId ? { ...t, status: 'empty', waiter: '' } : t));
      setSelectedTentId(null);
      setDiscountType('none');
      setDiscountValue(0);
    }, 300);
  };

  const totalSalesRevenue = invoiceHistory.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const filteredMenu = activeCategory === 'all' ? menuItems : menuItems.filter(m => m.category === activeCategory);

  // شاشة تسجيل الدخول الموحدة للنظام
  if (!currentUser) {
    return (
      <div className="bg-gradient-to-br from-green-900 to-emerald-950 min-h-screen flex items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-emerald-800 tracking-tight">مزرعة كرمل</h2>
            <p className="text-xs text-gray-500 font-medium">نظام التصفية، إدارة الورديات والمحاسبة الفورية</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">اسم المستخدم (بالأحرف الكبيرة والصغيرة)</label>
              <input type="text" required value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-black text-left outline-none font-medium focus:ring-2 focus:ring-emerald-700" placeholder="Boss / Cashier / Service" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">كلمة المرور</label>
              <input type="password" required value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-black text-left outline-none font-medium focus:ring-2 focus:ring-emerald-700" placeholder="••••" />
            </div>
            {loginError && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-all shadow-md">تسجيل الدخول للنظام</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col text-right text-black antialiased font-sans" dir="rtl">
      
      {/* تنسيقات الطباعة الفورية والتحكم بحجم ورقة الفاتورة الحرارية */}
      <style>{`
        @media print {
          body { background: white; color: black; font-family: sans-serif; padding: 0; margin: 0; }
          .print\\:hidden { display: none !important; }
          .thermal-receipt {
            width: 76mm;
            max-width: 76mm;
            padding: 3mm;
            margin: 0 auto;
            direction: rtl;
            text-align: right;
            font-size: 11px;
            line-height: 1.4;
          }
          .thermal-receipt h2 { font-size: 16px; font-weight: 900; margin-bottom: 2px; text-align: center; }
          .thermal-receipt p { font-size: 10px; margin: 2px 0; text-align: center; }
          .thermal-receipt table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          .thermal-receipt th { font-size: 10px; border-bottom: 1px dashed black; padding: 3px 0; text-align: right; }
          .thermal-receipt td { font-size: 11px; padding: 4px 0; vertical-align: top; }
          .thermal-divider { border-top: 1px dashed black; margin: 5px 0; }
          .receipt-totals { font-size: 11px; font-weight: bold; }
        }
      `}</style>

      {/* الهيدر العلوي */}
      <header className="bg-emerald-800 text-white shadow-md px-6 py-4 flex justify-between items-center print:hidden">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className="text-xl font-black tracking-wide">مزرعة كرمل <span className="text-xs font-normal text-emerald-200">Carmel Farm POS</span></h1>
          <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${shift.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            الصندوق: {shift.isOpen ? 'مفتوح للعمليات' : 'مغلق بالكامل'}
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="text-sm bg-emerald-700 px-3 py-1.5 rounded-lg font-bold shadow-inner">👤 {currentUser.name} ({currentUser.role.toUpperCase()})</span>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">خروج من الحساب</button>
        </div>
      </header>

      {/* لوحة التحكم الرئيسية */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 p-6 print:hidden">
        
        {/* الجزء الأيمن أو الأوسط الكبير (المخططات ولوحات التحكم) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* لوحة المدير العام الشاملة (Boss Dashboard) */}
          {currentUser.role === 'boss' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
              <h2 className="text-md font-black text-gray-800 flex items-center gap-2">📊 شاشة الرقابة الإدارية والتحكم الشامل</h2>
              
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
                  <span className="text-xs text-amber-800 block font-bold mb-1">حالة صندوق الكاشير الحالية</span>
                  <strong className="text-md font-bold text-amber-950 block mt-1">{shift.isOpen ? `مفتوح بعهدة ${shift.openingCash} ₪` : "مغلق حالياً"}</strong>
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={resetDayForBoss} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-colors">
                  🧹 تصفير اليوم وسجل النشاط
                </button>
                <p className="text-[11px] text-gray-500 sm:text-right">يمكن للبوس تصفير الطلبات والمبيعات وسجل النشاط بنهاية اليوم.</p>
              </div>

              {/* لوحة إدارة الأقسام والتصنيفات */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-red-800 mb-2">📁 إدارة تصنيفات وأقسام المنيو الديناميكية</h4>
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3 bg-red-50/50 p-3 rounded-xl">
                  <input type="text" placeholder="كود القسم الفريد (مثال: cold)" required value={newCategoryForm.id} onChange={(e) => setNewCategoryForm({...newCategoryForm, id: e.target.value})} className="p-2 border rounded-lg text-xs bg-white text-black outline-none" />
                  <input type="text" placeholder="الاسم بالعربية (مثال: مشروبات باردة)" required value={newCategoryForm.nameAr} onChange={(e) => setNewCategoryForm({...newCategoryForm, nameAr: e.target.value})} className="p-2 border rounded-lg text-xs bg-white text-black outline-none" />
                  <input type="text" placeholder="English Name" required value={newCategoryForm.nameEn} onChange={(e) => setNewCategoryForm({...newCategoryForm, nameEn: e.target.value})} className="p-2 border rounded-lg text-xs bg-white text-black outline-none" />
                  <button type="submit" className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg py-2 transition-colors">إضافة قسم جديد</button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <div key={c.id} className="bg-gray-50 border rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs shadow-sm">
                      <span><strong>{c.nameAr}</strong> <span className="text-gray-400 font-mono">({c.id})</span></span>
                      <button type="button" onClick={() => handleDeleteCategory(c.id)} className="text-red-600 font-bold hover:text-red-900 transition-colors" title="حذف هذا القسم بالكامل">❌</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* لوحة إدارة وجبات وعناصر المنيو */}
              <div className="border-t pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h4 className="text-xs font-bold text-gray-800">🍽️ إضافة وتعديل وجبات ومشروبات المنيو الرئيسي</h4>
                  <button type="button" onClick={() => setShowBossMenu(prev => !prev)} className="text-[11px] px-3 py-1 rounded-full bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-colors">
                    {showBossMenu ? 'إخفاء المنيو' : 'عرض المنيو'}
                  </button>
                </div>
                <form onSubmit={handleSaveMenu} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl">
                  <input type="text" placeholder="اسم الصنف بالعربية" required value={menuForm.nameAr} onChange={(e) => setMenuForm({ ...menuForm, nameAr: e.target.value })} className="p-2 text-xs border rounded-lg bg-white text-black outline-none" />
                  <input type="text" placeholder="English Name" required value={menuForm.nameEn} onChange={(e) => setMenuForm({ ...menuForm, nameEn: e.target.value })} className="p-2 text-xs border rounded-lg bg-white text-black outline-none" />
                  <input type="number" step="0.01" placeholder="السعر الإجمالي ₪" required value={menuForm.price || ''} onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) })} className="p-2 text-xs border rounded-lg bg-white text-black outline-none" />
                  <select value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} className="p-2 text-xs border rounded-lg bg-white text-black outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                  </select>
                  <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg py-2 transition-colors">
                    {isEditingMenu ? "تحديث التعديلات" : "حفظ الصنف بالمنيو"}
                  </button>
                </form>
                {showBossMenu && (
                  <div className="mt-4 bg-white border border-gray-200 rounded-xl p-3 max-h-56 overflow-y-auto">
                    <h5 className="text-xs font-bold text-gray-700 mb-2">📋 أصناف المنيو الحالية</h5>
                    {menuItems.length === 0 ? (
                      <p className="text-[11px] text-gray-500">لا يوجد أصناف بعد.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {menuItems.map(item => (
                          <div key={item.id} className="border rounded-xl p-2 bg-gray-50 text-[11px]">
                            <div className="font-bold text-gray-900">{item.nameAr}</div>
                            <div className="text-gray-500">{item.nameEn}</div>
                            <div className="text-emerald-700 font-black mt-1">{item.price} ₪</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* السجل الإداري البسيط والمطور (Scannable Audit Logs) */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-700 mb-2">🕵️‍♂️ سجل النشاط الفوري للموظفين والحركات الميدانية المباشرة</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50 rounded-lg">
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 p-2">لا توجد حركات مسجلة حالياً...</p>
                  ) : (
                    auditLogs.map(log => (
                      <div key={log.id} className="bg-white p-2 border rounded-lg flex items-start gap-2 shadow-sm text-xs">
                        <span className="text-lg">{log.icon}</span>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex justify-between items-center">
                            <strong className="text-gray-900 font-bold">{log.user}</strong>
                            <span className="text-[10px] text-gray-400 font-mono">{log.timestamp}</span>
                          </div>
                          <p className="text-emerald-800 font-semibold text-[11px]">{log.action}</p>
                          <p className="text-gray-500 text-[10px] truncate" title={log.details}>{log.details}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* لوحة تحكم الكاشير والصندوق (Cashier Shift Management) */}
          {currentUser.role === 'cashier' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">🪙 لوحة تحكم صندوق النقد والورديات الحالية</h3>
              {!shift.isOpen ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-red-50 p-4 rounded-xl border border-red-200">
                  <p className="text-xs text-red-800 font-bold flex-1">⚠️ الوردية مغلقة. يرجى إدخال عهدة الدرج الافتتاحية لبدء استقبال وإصدار فواتير الزبائن:</p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input type="number" placeholder="المبلغ ₪" value={shiftInputAmount || ''} onChange={(e) => setShiftInputAmount(parseFloat(e.target.value))} className="p-2 border rounded-lg text-xs bg-white text-black w-32 outline-none font-bold text-center" />
                    <button type="button" onClick={handleOpenShift} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">تأكيد فتح الصندوق</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-green-50 p-4 rounded-xl border border-green-200 gap-3">
                  <div className="text-xs text-green-800 font-bold">
                    🟢 الوردية نشطة الآن | الرصيد النقدي المتوقع بالصندوق حالياً: <strong className="text-sm underline font-black text-green-950">{shift.expectedCash.toFixed(2)} ₪</strong>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input type="number" placeholder="الجرد النقدي الفعلي ₪" value={shiftInputAmount || ''} onChange={(e) => setShiftInputAmount(parseFloat(e.target.value))} className="p-2 border rounded-lg text-xs bg-white text-black w-40 outline-none text-center font-bold" />
                    <button type="button" onClick={handleCloseShift} className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">إنهاء وإقفال الوردية الحالية وبث الفروقات</button>
                  </div>
                </div>
              )}

              {/* خط تتبع الطلبات المستلمة من مضيفي الميدان */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-emerald-800 mb-3 flex items-center gap-1.5">📥 خط الطلبات الحية الواردة (للتجهيز والمتابعة)</h4>
                {incomingOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">لا توجد طلبات معلقة بانتظار المحاسبة أو التجهيز...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {incomingOrders.map((order) => (
                      <div key={order.id} className={`p-3 border rounded-xl flex flex-col justify-between transition-all shadow-sm ${order.isDone ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-0.5 rounded-full">طلب #{order.id}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{order.timestamp}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <strong className="text-sm text-gray-900 font-black">{order.tableId}</strong>
                            <span className="text-[10px] text-gray-400 font-medium">الويتر: {order.waiter}</span>
                          </div>
                          <div className="text-xs text-gray-700 flex flex-wrap gap-1 pt-1 border-t border-dashed border-gray-300">
                            {order.items.map((item: any, idx: number) => {
                              const m = menuItems.find(mi => mi.id === item.menuId);
                              return <span key={idx} className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[11px] font-medium">✔️ {m?.nameAr} × {item.qty}</span>;
                            })}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                            <input type="checkbox" checked={order.isDone} onChange={() => toggleOrderDone(order.id)} className="w-4 h-4 accent-emerald-700 cursor-pointer" />
                            <span>تم تسليم الطلب للموقع</span>
                          </label>
                          <button type="button" onClick={() => { setSelectedTentId(order.tableId); setDiscountType('none'); setDiscountValue(0); }} className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors">عرض الفاتورة الحالية</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* المخطط الفوري للخيام والطاولات المفتوحة (تظهر لجميع الصلاحيات للمراقبة والمتابعة) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-md font-bold text-gray-800">🗺️ المخطط الميداني المباشر لمواقع الجلوس</h3>
                <p className="text-[11px] text-gray-400">انقر فوق أي خيمة أو طاولة لاستعراض الحساب وإدارتها بالكامل</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button type="button" onClick={addExternalTable} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors flex-1 sm:flex-none">➕ إضافة طاولة خارجية</button>
                <button type="button" onClick={() => setIsTransferOpen(true)} className="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors flex-1 sm:flex-none">🔄 نقل طلبات الحساب</button>
              </div>
            </div>

            {/* نافذة منبثقة لنقل طلبات الطاولات */}
            {isTransferOpen && (
              <div className="bg-gray-50 border p-4 rounded-xl mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">من الموقع الحالي:</label>
                  <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white text-black outline-none">
                    <option value="">اختر الموقع المراد نقله...</option>
                    {tents.map(t => {
                      const hasOrders = incomingOrders.some(o => o.tableId === t.id);
                      if (!hasOrders) return null;
                      return <option key={t.id} value={t.id}>{t.id} (نشط)</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">إلى الموقع الجديد:</label>
                  <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white text-black outline-none">
                    <option value="">اختر موقع الوجهة المستهدف...</option>
                    {tents.map(t => (
                      <option key={t.id} value={t.id}>{t.id}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={executeTransfer} disabled={!transferFrom || !transferTo} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-bold py-2 rounded-lg transition-all">تأكيد عملية النقل الفوري</button>
                  <button type="button" onClick={() => setIsTransferOpen(false)} className="bg-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors">إلغاء</button>
                </div>
              </div>
            )}

            {/* شبكة عرض الخيام والطاولات */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {tents.map(tent => {
                const tableOrders = incomingOrders.filter(o => o.tableId === tent.id);
                let statusClass = 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100/80';
                if (tableOrders.length > 0) statusClass = 'bg-red-500 border-red-600 text-white animate-pulse';
                const isSelected = tent.id === selectedTentId ? 'ring-4 ring-emerald-600 ring-offset-2' : '';

                return (
                  <div key={tent.id} className="relative group">
                    <div 
                      onClick={() => { setSelectedTentId(tent.id); setDiscountType('none'); setDiscountValue(0); }} 
                      className={`p-3 border rounded-xl flex flex-col justify-between items-center text-center cursor-pointer h-24 transition-all shadow-sm ${statusClass} ${isSelected}`}
                    >
                      <span className="text-[9px] opacity-75">{tent.type === 'tent' ? '⛺ خيمة' : '🪑 طاولة'}</span>
                      <strong className="text-sm font-black">{tent.displayId}</strong>
                      {tableOrders.length > 0 ? (
                        <span className="text-[10px] bg-black bg-opacity-20 px-1.5 py-0.5 rounded font-bold">نشط ({tableOrders.length})</span>
                      ) : (
                        <span className="text-[9px] text-gray-400">فارغ</span>
                      )}
                    </div>
                    {currentUser.role === 'boss' && (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteTablePermanently(tent.id); }} 
                        className="absolute -top-1.5 -left-1.5 bg-red-600 text-white rounded-full w-5 h-5 text-[11px] font-bold flex items-center justify-center shadow hover:bg-red-800 transition-colors"
                        title="حذف هذا الموقع نهائياً"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* العمود الأيسر الجانبي (سلة السيرفيس أو كشف حساب الفاتورة للكاشير) */}
        <div className="bg-white rounded-2xl shadow-md border flex flex-col h-[calc(100vh-120px)] sticky top-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b rounded-t-2xl">
              <h3 className="font-bold text-gray-800 text-xs">
                {selectedTentId ? `📍 الموقع المحدد: ${selectedTentId}` : '⚠️ الرجاء اختيار موقع من المخطط'}
              </h3>
              {currentTableOrders.length > 0 && (
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                  يوجد {currentTableOrders.length} طلبات مسجلة بالحساب
                </span>
              )}
            </div>

          {/* لوحة أخذ الطلبات وعناصر المنيو: تظهر حصراً لحساب مضيف الميدان (Service) */}
          {currentUser.role === 'service' ? (
            <>
              {/* شريط تصنيفات المنيو سريع التنقل */}
              <div className="p-2 border-b flex gap-1 overflow-x-auto text-[11px] bg-gray-50/50">
                <button type="button" onClick={() => setActiveCategory('all')} className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-emerald-800 text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>الكل</button>
                {categories.map(c => (
                  <button type="button" key={c.id} onClick={() => setActiveCategory(c.id)} className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${activeCategory === c.id ? 'bg-emerald-800 text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>{c.nameAr}</button>
                ))}
              </div>

              {/* شبكة اختيار أصناف الطعام والمشروبات */}
              <div className="p-2 bg-gray-50 grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto border-b">
                {filteredMenu.map(item => (
                  <button type="button" key={item.id} onClick={() => addItemToServiceCart(item.id)} className="bg-white border p-2 rounded-xl text-right text-xs hover:border-emerald-700 hover:shadow-sm transition-all">
                    <span className="block font-bold text-gray-800 truncate">{item.nameAr}</span>
                    <strong className="text-emerald-700 block mt-0.5 font-mono">{item.price} ₪</strong>
                  </button>
                ))}
              </div>

              {/* سلة الميدان المؤقتة قبل الإرسال للكاشير والمطبخ */}
              <div className="p-3 bg-blue-50/80 border-b space-y-2 flex-1 flex flex-col justify-between overflow-hidden">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 mb-1">📝 بناء سلة الطلب الحالية المجهزة للميدان</h4>
                  {serviceCart.length === 0 ? (
                    <p className="text-[11px] text-gray-400 py-6 text-center">السلة فارغة. انقر فوق الأصناف بالأعلى للبناء والتجهيز...</p>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {serviceCart.map(item => {
                        const m = menuItems.find(mi => mi.id === item.menuId);
                        return (
                          <div key={item.menuId} className="flex justify-between items-center bg-white p-1.5 rounded border border-blue-200 text-[11px] shadow-sm">
                            <span className="font-bold text-gray-800 truncate">{m?.nameAr}</span>
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => adjustCartQty(item.menuId, -1)} className="w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded font-black text-center text-xs text-gray-700 transition-colors">-</button>
                              <span className="font-mono font-bold px-1 text-blue-900">{item.qty}</span>
                              <button type="button" onClick={() => adjustCartQty(item.menuId, 1)} className="w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded font-black text-center text-xs text-gray-700 transition-colors">+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="sticky bottom-0 left-0 right-0 bg-blue-50/80 pt-2 z-10">
                  <button 
                    type="button"
                    onClick={dispatchOrderToCashier} 
                    disabled={serviceCart.length === 0 || !selectedTentId || isDispatching} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all mt-2"
                  >
                    {isDispatching ? '⏳ جاري إرسال الطلب...' : '🚀 بث وإرسال الطلب رسمياً (رنين الكاشير)'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* في حال كان الحساب كاشير أو مدير: تظهر لوحة الحساب المالي والتصفية فقط دون إمكانية إدخال طلبات */
            <div className="p-3 bg-gray-50 border-b text-xs text-gray-500 text-center font-medium">
              ℹ️ صلاحية أخذ وبناء الطلبات وتعبئة السلة تقع حصراً على عاتق مضيف الميدان (Service).
            </div>
          )}

          {/* استعراض تفاصيل الفاتورة والمجاميع المالية النهائية (متاح للجميع وخاصة الكاشير للتصفية) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 bg-opacity-40">
            <h4 className="text-[11px] font-bold text-gray-500 border-b pb-1">🗂️ كشف الأصناف المسجلة بالحساب غير المدفوعة:</h4>
            {currentTableOrders.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-6">لا توجد طلبات معلقة مسجلة لهذا الموقع.</p>
            ) : (
              <div className="space-y-2">
                {currentTableOrders.map((order, oIdx) => (
                  <div key={oIdx} className="bg-white border rounded-lg p-2 text-[11px] space-y-1 shadow-inner">
                    <div className="flex justify-between text-[10px] text-gray-400 border-b pb-1">
                      <span>طلب #{order.id}</span>
                      <span>وقت الإرسال: {order.timestamp}</span>
                    </div>
                    {order.items.map((oi: any, idx: number) => {
                      const mItem = menuItems.find(m => m.id === oi.menuId);
                      return (
                        <div key={idx} className="flex justify-between items-center text-gray-700 font-medium">
                          <span>• {mItem?.nameAr}</span>
                          <span className="font-bold">×{oi.qty}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* نظام الخصومات الفوري (متاح للكاشير عند المحاسبة وتجهيز الفاتورة) */}
                {currentUser.role === 'cashier' && (
                  <div className="bg-amber-50/70 p-2.5 border border-amber-200 rounded-xl space-y-2 mt-2">
                    <span className="text-[11px] font-bold text-amber-900 block">🏷️ نظام تطبيق الخصومات الإدارية:</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button type="button" onClick={() => { setDiscountType('none'); setDiscountValue(0); }} className={`p-1 rounded text-center text-[10px] font-bold transition-all ${discountType === 'none' ? 'bg-amber-800 text-white' : 'bg-white border border-amber-300 text-amber-900'}`}>بلا خصم</button>
                      <button type="button" onClick={() => { setDiscountType('amount'); setDiscountValue(0); }} className={`p-1 rounded text-center text-[10px] font-bold transition-all ${discountType === 'amount' ? 'bg-amber-800 text-white' : 'bg-white border border-amber-300 text-amber-900'}`}>مبلغ (₪)</button>
                      <button type="button" onClick={() => { setDiscountType('percent'); setDiscountValue(0); }} className={`p-1 rounded text-center text-[10px] font-bold transition-all ${discountType === 'percent' ? 'bg-amber-800 text-white' : 'bg-white border border-amber-300 text-amber-900'}`}>نسبة (%)</button>
                    </div>
                    {discountType !== 'none' && (
                      <div className="flex items-center gap-2 mt-1 animate-fadeIn">
                        <span className="text-[10px] font-bold text-amber-800 whitespace-nowrap">{discountType === 'amount' ? 'قيمة الخصم شيكل:' : 'نسبة الخصم %:'}</span>
                        <input type="number" min="0" value={discountValue || ''} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className="w-full p-1 border rounded text-xs text-center font-bold bg-white text-black outline-none" placeholder="0" />
                      </div>
                    )}
                  </div>
                )}

                {/* ملخص الحساب المالي للفاتورة */}
                <div className="border-t pt-2 space-y-1 text-xs font-medium text-gray-700">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي الأولي:</span>
                    <span className="font-mono">{currentSubtotal.toFixed(2)} ₪</span>
                  </div>
                  {currentDiscountAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-bold bg-red-50 p-1 rounded">
                      <span>إجمالي الخصم المطبق:</span>
                      <span className="font-mono">-{currentDiscountAmount.toFixed(2)} ₪</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>الضريبة والخدمات المقررة (10%):</span>
                    <span className="font-mono">{currentTax.toFixed(2)} ₪</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-emerald-800 border-t pt-1 border-dashed">
                    <span>الإجمالي النهائي المطلوب:</span>
                    <span className="font-mono underline">{currentTotal.toFixed(2)} ₪</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          </div>
          {/* زر تصفية وإصدار الفاتورة الحرارية النهائي */}
          <div className="p-3 bg-white border-t rounded-b-2xl sticky bottom-0 z-20">
            <button
              type="button"
              onClick={handlePaymentAndPrint}
              disabled={currentTableOrders.length === 0 || !shift.isOpen || currentUser.role === 'service'}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all shadow-md"
            >
              🧾 قبض الحساب وإصدار الفاتورة الحرارية (طابعة)
            </button>
            {!shift.isOpen && (
              <p className="text-[10px] text-red-500 font-bold text-center mt-1">⚠️ يجب فتح وردية صندوق النقد أولاً لتفعيل طباعة الفواتير.</p>
            )}
            {currentUser.role === 'service' && (
              <p className="text-[10px] text-amber-600 font-bold text-center mt-1">ℹ️ المحاسبة وإصدار الفواتير تقع تحت مسؤولية الكاشير حصراً.</p>
            )}
          </div>
        </div>
      </main>

      {/* شاشة الهيكلة الخاصة بالفاتورة المطبوعة والحرارية (المخفية من المتصفح وتظهر فقط أثناء الطباعة) */}
      <div className="hidden print:block thermal-receipt">
        <h2>مزرعة كرمل</h2>
        <p>هاتف: 0599988825</p>
        <p>التاريخ والوقت: {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}</p>
        <p style={{ fontWeight: 'bold' }}>رقم الفاتورة: #{Math.floor(100000 + Math.random() * 900000)}</p>
        <p style={{ fontSize: '11px', fontWeight: '900', border: '1px solid black', padding: '2px', marginTop: '4px' }}>
          الحساب الخاص بـ: {selectedTentId}
        </p>

        <div className="thermal-divider"></div>

        <table>
          <thead>
            <tr>
              <th>الصنف</th>
              <th style={{ textAlign: 'center' }}>الكمية</th>
              <th style={{ textAlign: 'left' }}>السعر</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // تجميع كافة المواد المكررة لطباعتها مدمجة ونظيفة تماماً بالفاتورة
              const aggregatedItems: { [key: number]: number } = {};
              currentTableOrders.forEach(o => {
                o.items.forEach((item: any) => {
                  aggregatedItems[item.menuId] = (aggregatedItems[item.menuId] || 0) + item.qty;
                });
              });

              return Object.keys(aggregatedItems).map((menuIdStr) => {
                const mId = parseInt(menuIdStr);
                const qty = aggregatedItems[mId];
                const itemDetails = menuItems.find(mi => mi.id === mId);
                if (!itemDetails) return null;
                return (
                  <tr key={mId}>
                    <td>{itemDetails.nameAr}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{qty}</td>
                    <td style={{ textAlign: 'left', fontFamily: 'monospace' }}>{(itemDetails.price * qty).toFixed(2)} ₪</td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>

        <div className="thermal-divider"></div>

        <div className="receipt-totals" style={{ display: 'flex', justifyContent: 'between' }}>
          <span>المجموع الفرعي الأولي:</span>
          <span style={{ fontFamily: 'monospace' }}>{currentSubtotal.toFixed(2)} ₪</span>
        </div>
        
        {currentDiscountAmount > 0 && (
          <div className="receipt-totals" style={{ display: 'flex', justifyContent: 'between', color: 'black' }}>
            <span>الخصم الممنوح والمطبق:</span>
            <span style={{ fontFamily: 'monospace' }}>-{currentDiscountAmount.toFixed(2)} ₪</span>
          </div>
        )}

        <div className="receipt-totals" style={{ display: 'flex', justifyContent: 'between' }}>
          <span>الضريبة والخدمات المقررة (10%):</span>
          <span style={{ fontFamily: 'monospace' }}>{currentTax.toFixed(2)} ₪</span>
        </div>

        <div className="thermal-divider" style={{ borderTop: '1px solid black' }}></div>

        <div className="receipt-totals" style={{ display: 'flex', justifyContent: 'between', fontSize: '13px', fontWeight: '900' }}>
          <span>الإجمالي النهائي الصافي:</span>
          <span style={{ fontFamily: 'monospace' }}>{currentTotal.toFixed(2)} ₪</span>
        </div>

        <div className="thermal-divider"></div>
        <p style={{ textAlign: 'center', fontSize: '10px', marginTop: '8px', fontWeight: 'bold' }}>شكراً لزيارتكم • أهلاً وسهلاً بكم في مزرعة كرمل</p>
      </div>

    </div>
  );
}