'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MenuItem {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
  category: string;
}

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface ServiceCart {
  menuId: number;
  qty: number;
}

interface Tent {
  id: string;
  displayId: string | number;
  type: 'tent' | 'table';
  status: 'empty' | 'occupied';
  waiter: string;
}

interface Order {
  id: number;
  tableId: string;
  waiter: string;
  timestamp: string;
  items: ServiceCart[];
  isDone: boolean;
}

interface Invoice {
  id: number;
  tableId: string;
  timestamp: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
}

interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  icon: string;
}

interface Shift {
  isOpen: boolean;
  openedBy: string;
  openingCash: number;
  expectedCash: number;
  closedCash: number;
  discrepancy: number;
  status: 'open' | 'closed';
}

interface User {
  id: number;
  username: string;
  password: string;
  role: 'boss' | 'cashier' | 'service';
  name: string;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  tents: Tent[];
  setTents: (tents: Tent[]) => void;
  incomingOrders: Order[];
  setIncomingOrders: (orders: Order[]) => void;
  invoiceHistory: Invoice[];
  setInvoiceHistory: (invoices: Invoice[]) => void;
  auditLogs: AuditLog[];
  setAuditLogs: (logs: AuditLog[]) => void;
  shift: Shift;
  setShift: (shift: Shift) => void;
  logAction: (user: string, action: string, details: string, icon?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'drinks', nameAr: 'مشروبات', nameEn: 'Drinks' },
    { id: 'meals', nameAr: 'وجبات ومشاوي', nameEn: 'Meals & Grills' },
    { id: 'hookah', nameAr: 'أراجيل', nameEn: 'Hookah' }
  ]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 1, nameAr: "قهوة عربية (دلة)", nameEn: "Arabic Coffee (Dallah)", price: 25, category: "drinks" },
    { id: 2, nameAr: "شاي مرمية بلدية", nameEn: "Local Sage Tea", price: 7, category: "drinks" },
    { id: 3, nameAr: "كيلو مشاوي مشكل", nameEn: "1KG Mixed Grill", price: 140, category: "meals" },
    { id: 7, nameAr: "أرجيلة تفاحتين فاخر", nameEn: "Premium Double Apple Hookah", price: 30, category: "hookah" }
  ]);

  const [tents, setTents] = useState<Tent[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [invoiceHistory, setInvoiceHistory] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [shift, setShift] = useState<Shift>({
    isOpen: false,
    openedBy: '',
    openingCash: 0,
    expectedCash: 0,
    closedCash: 0,
    discrepancy: 0,
    status: 'closed'
  });

  // تهيئة الخيام
  useEffect(() => {
    const initialTents = [];
    for (let i = 1; i <= 20; i++) {
      initialTents.push({
        id: `خيمة ${i}`,
        displayId: i,
        type: 'tent' as const,
        status: 'empty' as const,
        waiter: ''
      });
    }
    setTents(initialTents);
  }, []);

  // تحميل البيانات من localStorage عند التحديث
  useEffect(() => {
    const savedUser = localStorage.getItem('carmel_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.log('Error loading user from localStorage', e);
      }
    }

    const savedMenuItems = localStorage.getItem('carmel_menuItems');
    if (savedMenuItems) {
      try {
        setMenuItems(JSON.parse(savedMenuItems));
      } catch (e) {
        console.log('Error loading menuItems from localStorage', e);
      }
    }

    const savedCategories = localStorage.getItem('carmel_categories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.log('Error loading categories from localStorage', e);
      }
    }

    const savedOrders = localStorage.getItem('carmel_orders');
    if (savedOrders) {
      try {
        setIncomingOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.log('Error loading orders from localStorage', e);
      }
    }

    const savedInvoices = localStorage.getItem('carmel_invoices');
    if (savedInvoices) {
      try {
        setInvoiceHistory(JSON.parse(savedInvoices));
      } catch (e) {
        console.log('Error loading invoices from localStorage', e);
      }
    }

    const savedAuditLogs = localStorage.getItem('carmel_auditLogs');
    if (savedAuditLogs) {
      try {
        setAuditLogs(JSON.parse(savedAuditLogs));
      } catch (e) {
        console.log('Error loading auditLogs from localStorage', e);
      }
    }

    const savedShift = localStorage.getItem('carmel_shift');
    if (savedShift) {
      try {
        setShift(JSON.parse(savedShift));
      } catch (e) {
        console.log('Error loading shift from localStorage', e);
      }
    }
  }, []);

  // حفظ البيانات إلى localStorage عند التغيير
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('carmel_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('carmel_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('carmel_menuItems', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('carmel_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('carmel_orders', JSON.stringify(incomingOrders));
  }, [incomingOrders]);

  useEffect(() => {
    localStorage.setItem('carmel_invoices', JSON.stringify(invoiceHistory));
  }, [invoiceHistory]);

  useEffect(() => {
    localStorage.setItem('carmel_auditLogs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('carmel_shift', JSON.stringify(shift));
  }, [shift]);

  const logAction = (user: string, action: string, details: string, icon: string = '📝') => {
    const newLog: AuditLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      user,
      action,
      details,
      icon
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
