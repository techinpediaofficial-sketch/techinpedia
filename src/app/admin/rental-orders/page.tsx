'use client';

import { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Building,
  User,
  Laptop,
  MapPin,
  X,
  AlertCircle,
  Phone,
  PhoneCall,
  Cpu,
  Trash2,
  Eye,
  FileText,
  Percent,
  Receipt,
  Sparkles,
  Info,
  Layers,
  Clock,
  ShieldCheck,
  Check,
  PackagePlus,
  Monitor,
  HardDrive,
  Edit3,
  Save,
} from 'lucide-react';

interface RentalOrderItem {
  id: string;
  rate: number;
  returnedAt?: string | null;
  asset: {
    id: string;
    assetCode: string;
    serialNumber: string;
    brand: string;
    model: string;
    specs: string;
    assetType?: string;
  };
}

interface RentalOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    company?: { name: string } | null;
    companyName?: string | null;
    email: string;
    phone?: string | null;
    notes?: string | null;
  };
  startDate: string;
  endDate?: string | null;
  billingCycle: string;
  monthlyRate: number;
  securityDeposit: number;
  deliveryAddress: string;
  status: string;
  agreementRef?: string | null;
  items: RentalOrderItem[];
  createdAt?: string;
}

interface AvailableAsset {
  id: string;
  assetCode: string;
  brand: string;
  model: string;
  serialNumber: string;
  specs?: string;
}

interface CustomerOption {
  id: string;
  name: string;
  phone?: string | null;
  companyName?: string | null;
  company?: { name: string } | null;
}

interface RentalProductItem {
  systemConfiguration: string;
  quantity: number;
  rentPerPiece: number;
  gstPerPiece: number;
  unitRate?: number;
  lineTotal?: number;
  assetType?: string;
  assetBrand?: string;
  assetModel?: string;
}

interface ManualRentalMetadata {
  manual?: boolean;
  customerName?: string;
  customerPhone?: string;
  customerAltPhone?: string;
  deliveryAddress?: string;
  totalQuantity?: number;
  systemConfiguration?: string;
  quantity?: number;
  rentPerPiece?: number;
  gstPerPiece?: number;
  assetType?: string;
  assetBrand?: string;
  assetModel?: string;
  items?: RentalProductItem[];
  customRef?: string;
}

interface ProductItemState {
  id: string;
  systemConfiguration: string;
  quantity: string;
  rentPerPiece: string;
  gstPerPiece: string;
  assetType: string;
  assetBrand: string;
  assetModel: string;
}

function createEmptyProductItem(): ProductItemState {
  return {
    id: Math.random().toString(36).substring(2, 9),
    systemConfiguration: '',
    quantity: '1',
    rentPerPiece: '2000',
    gstPerPiece: '360',
    assetType: 'LAPTOP',
    assetBrand: 'Dell / HP',
    assetModel: 'Commercial Laptop',
  };
}

function parseRentalMetadata(ref?: string | null): ManualRentalMetadata | null {
  if (!ref || typeof ref !== 'string') return null;
  const trimmed = ref.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return null;
}

function extractAltPhone(customerNotes?: string | null, metadataAltPhone?: string): string | null {
  if (metadataAltPhone?.trim()) return metadataAltPhone.trim();
  if (!customerNotes) return null;
  const match = customerNotes.match(/Alt(?:\s*Phone|\s*Mobile)?\s*[:=-]\s*([0-9+\s-]{8,15})/i);
  return match ? match[1].trim() : null;
}

export default function RentalOrdersPage() {
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, monthlyRunrate: 0, totalDeposits: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [viewOrder, setViewOrder] = useState<RentalOrder | null>(null);
  const [orderToAddItems, setOrderToAddItems] = useState<RentalOrder | null>(null);

  // Available assets & customers
  const [availableAssets, setAvailableAssets] = useState<AvailableAsset[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  // Modal Mode Toggles
  const [customerMode, setCustomerMode] = useState<'MANUAL' | 'EXISTING'>('MANUAL');
  const [assetMode, setAssetMode] = useState<'MANUAL' | 'INVENTORY'>('MANUAL');

  // Customer & Contract Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAltPhone: '',
    customerAddress: '',
    customerId: '',

    startDate: new Date().toISOString().split('T')[0],
    endDate: '', // blank by default (optional, open lease)
    billingCycle: 'MONTHLY',
    securityDeposit: '', // blank by default (optional)
    deliveryAddress: '',
    agreementRef: '',

    // Inventory Asset mode
    assetIds: [] as string[],
    monthlyRate: '2360',
  });

  // Multi-product items state for New Order
  const [productItems, setProductItems] = useState<ProductItemState[]>([createEmptyProductItem()]);

  // Multi-product items state for "Add Products to Existing Order"
  const [appendItems, setAppendItems] = useState<ProductItemState[]>([createEmptyProductItem()]);
  const [appending, setAppending] = useState(false);

  // Edit Order state
  const [editingOrder, setEditingOrder] = useState<RentalOrder | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAltPhone: '',
    customerEmail: '',
    customerAddress: '',
    deliveryAddress: '',
    startDate: '',
    endDate: '',
    billingCycle: 'MONTHLY',
    securityDeposit: '0',
    agreementRef: '',
    status: 'ACTIVE',
    notes: '',
  });
  const [editProductItems, setEditProductItems] = useState<ProductItemState[]>([createEmptyProductItem()]);

  // Payment Tracking & Monthly Rent Ledger State
  const [orderForPayments, setOrderForPayments] = useState<RentalOrder | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    summary?: { totalCycles: number; totalExpected: number; totalPaid: number; totalPending: number };
    cycles?: any[];
  } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    cycleMonth: '',
    cycleLabel: '',
    expectedAmount: 0,
    payAmount: '',
    paymentMethod: 'UPI',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionRef: '',
    invoiceNumber: '',
    notes: '',
  });

  // Discontinue & Equipment Return Settlement State
  const [orderForDiscontinue, setOrderForDiscontinue] = useState<RentalOrder | null>(null);
  const selectedOrderForDiscontinue = orderForDiscontinue;
  const setSelectedOrderForDiscontinue = setOrderForDiscontinue;
  const selectedOrderForPayment = orderForPayments;
  const setSelectedOrderForPayment = setOrderForPayments;

  const [discontinueDate, setDiscontinueDate] = useState(new Date().toISOString().split('T')[0]);
  const [discontinueStatus, setDiscontinueStatus] = useState<'RETURNED' | 'DISCONTINUATION_REQUESTED'>('RETURNED');
  const [discontinueReason, setDiscontinueReason] = useState('');
  const [discontinueNotes, setDiscontinueNotes] = useState('');

  const [discontinueSubmitting, setDiscontinueSubmitting] = useState(false);
  const [discontinueForm, setDiscontinueForm] = useState({
    actionType: 'COMPLETE_RETURN' as 'REQUEST_DISCONTINUATION' | 'COMPLETE_RETURN',
    discontinueReason: 'Requirement completed / Client project finished',
    returnDate: new Date().toISOString().split('T')[0],
    returnCondition: 'GOOD' as 'GOOD' | 'MINOR_SCRATCHES' | 'DAMAGED' | 'PARTS_MISSING',
    inspectionNotes: 'Hardware returned with original charger & accessories in working condition.',
    depositDeduction: '0',
    deductionReason: '',
    unpaidRentDeduction: '0',
    depositRefundStatus: 'REFUNDED' as 'REFUNDED' | 'PENDING_SETTLEMENT' | 'ADJUSTED_TO_RENT' | 'FORFEITED',
    depositRefundPaymentMode: 'UPI' as 'UPI' | 'BANK_TRANSFER' | 'CASH',
    depositRefundRef: '',
  });

  const configPresets = [
    {
      title: '💻 Developer Core i7 Laptop',
      type: 'LAPTOP',
      brand: 'Dell / Lenovo',
      model: 'Latitude / ThinkPad',
      specs: 'Processor: Intel Core i7 12th Gen | RAM: 16GB DDR4 | Storage: 512GB NVMe SSD | Display: 15.6" FHD Anti-Glare | Charger & Laptop Bag Included',
      rent: '3000',
      gst: '540',
    },
    {
      title: '🏢 Office Desktop PC Setup',
      type: 'DESKTOP',
      brand: 'Custom / Assembled',
      model: 'Office PC',
      specs: 'Processor: Intel Core i5 10th Gen | RAM: 8GB DDR4 | Storage: 256GB SSD | Display: 21.5" FHD Monitor | Keyboard & Mouse Included',
      rent: '1800',
      gst: '324',
    },
    {
      title: '⚡ Heavy Workstation / GPU Rig',
      type: 'WORKSTATION',
      brand: 'Custom Workstation',
      model: 'Render Rig Pro',
      specs: 'Processor: Intel Core i9 / AMD Ryzen 9 | RAM: 32GB DDR5 | Storage: 1TB NVMe SSD | Dedicated GPU: 6GB Graphics | Display: 27" 2K IPS Monitor',
      rent: '5000',
      gst: '900',
    },
    {
      title: '🍏 Apple MacBook Pro / Air',
      type: 'LAPTOP',
      brand: 'Apple',
      model: 'MacBook M2 / M3',
      specs: 'Apple M2 Silicon Chip | 16GB Unified RAM | 512GB Superfast SSD | 13.6" / 14" Retina Display | MagSafe 3 Charger Included',
      rent: '4500',
      gst: '810',
    },
    {
      title: '🖥️ 24" / 27" External Display Monitor',
      type: 'MONITOR',
      brand: 'Dell / LG',
      model: 'IPS FHD Monitor',
      specs: '24-inch / 27-inch Full HD 1080p IPS Display | HDMI & DisplayPort | Height Adjustable Stand | Power & HDMI Cable Included',
      rent: '700',
      gst: '126',
    },
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/hardware/rentals?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Fetch rental orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [assetsRes, custRes] = await Promise.all([
        fetch('/api/hardware/assets?status=AVAILABLE'),
        fetch('/api/crm/customers'),
      ]);
      const assetsData = await assetsRes.json();
      const custData = await custRes.json();

      if (assetsData.success) setAvailableAssets(assetsData.assets || []);
      if (custData.success && custData.customers) {
        setCustomers(custData.customers || []);
        if (custData.customers.length > 0 && !formData.customerId) {
          setFormData((prev) => ({ ...prev, customerId: custData.customers[0].id }));
        }
      }
    } catch (err) {
      console.error('Fetch dependencies error:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  // Multi-item handlers for New Order
  const addProductItem = () => {
    setProductItems((prev) => [...prev, createEmptyProductItem()]);
  };

  const removeProductItem = (id: string) => {
    if (productItems.length <= 1) return;
    setProductItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateProductItem = (id: string, field: keyof ProductItemState, value: string) => {
    setProductItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const applyPresetToItem = (id: string, preset: (typeof configPresets)[0]) => {
    setProductItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              systemConfiguration: preset.specs,
              assetType: preset.type,
              assetBrand: preset.brand,
              assetModel: preset.model,
              rentPerPiece: preset.rent,
              gstPerPiece: preset.gst,
            }
          : it
      )
    );
  };

  const setItemGstPct = (id: string, pct: number) => {
    setProductItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const rent = parseFloat(it.rentPerPiece) || 0;
        const gst = Math.round((rent * pct) / 100);
        return { ...it, gstPerPiece: String(gst) };
      })
    );
  };

  // Calculations for New Order Multi-items
  const totalHardwareDevices = productItems.reduce(
    (acc, it) => acc + (Math.max(1, parseInt(it.quantity, 10) || 1)),
    0
  );
  const totalMonthlyRunrate = productItems.reduce((acc, it) => {
    const q = Math.max(1, parseInt(it.quantity, 10) || 1);
    const r = Math.max(0, parseFloat(it.rentPerPiece) || 0);
    const g = Math.max(0, parseFloat(it.gstPerPiece) || 0);
    return acc + q * (r + g);
  }, 0);

  // Multi-item handlers for "Add Products"
  const addAppendItem = () => {
    setAppendItems((prev) => [...prev, createEmptyProductItem()]);
  };

  const removeAppendItem = (id: string) => {
    if (appendItems.length <= 1) return;
    setAppendItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateAppendItem = (id: string, field: keyof ProductItemState, value: string) => {
    setAppendItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const applyPresetToAppendItem = (id: string, preset: (typeof configPresets)[0]) => {
    setAppendItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              systemConfiguration: preset.specs,
              assetType: preset.type,
              assetBrand: preset.brand,
              assetModel: preset.model,
              rentPerPiece: preset.rent,
              gstPerPiece: preset.gst,
            }
          : it
      )
    );
  };

  const setAppendItemGstPct = (id: string, pct: number) => {
    setAppendItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const rent = parseFloat(it.rentPerPiece) || 0;
        const gst = Math.round((rent * pct) / 100);
        return { ...it, gstPerPiece: String(gst) };
      })
    );
  };

  const appendTotalUnits = appendItems.reduce(
    (acc, it) => acc + (Math.max(1, parseInt(it.quantity, 10) || 1)),
    0
  );
  const appendTotalRunrate = appendItems.reduce((acc, it) => {
    const q = Math.max(1, parseInt(it.quantity, 10) || 1);
    const r = Math.max(0, parseFloat(it.rentPerPiece) || 0);
    const g = Math.max(0, parseFloat(it.gstPerPiece) || 0);
    return acc + q * (r + g);
  }, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (customerMode === 'MANUAL') {
      if (!formData.customerName.trim()) {
        alert('Please enter Customer Name.');
        return;
      }
      if (!formData.customerPhone.trim()) {
        alert('Please enter Customer Phone Number.');
        return;
      }
      if (!formData.customerAddress.trim() && !formData.deliveryAddress.trim()) {
        alert('Please enter Delivery / Installation Address.');
        return;
      }
    } else {
      if (!formData.customerId) {
        alert('Please select a customer.');
        return;
      }
      if (!formData.deliveryAddress.trim()) {
        alert('Please enter Delivery / Installation Address.');
        return;
      }
    }

    if (assetMode === 'MANUAL') {
      for (let i = 0; i < productItems.length; i++) {
        const item = productItems[i];
        if (!item.systemConfiguration.trim()) {
          alert(`Product #${i + 1}: Please enter the system configuration specs.`);
          return;
        }
        if ((parseFloat(item.rentPerPiece) || 0) <= 0) {
          alert(`Product #${i + 1}: Please enter a valid rent per piece.`);
          return;
        }
      }
    } else {
      if (formData.assetIds.length === 0) {
        alert('Please select at least one hardware asset from inventory.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        isManualCustomer: customerMode === 'MANUAL',
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAltPhone: formData.customerAltPhone,
        customerAddress: formData.customerAddress,
        customerId: customerMode === 'EXISTING' ? formData.customerId : undefined,

        isManualAsset: assetMode === 'MANUAL',
        items:
          assetMode === 'MANUAL'
            ? productItems.map((it) => ({
                systemConfiguration: it.systemConfiguration.trim(),
                quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
                rentPerPiece: Math.max(0, parseFloat(it.rentPerPiece) || 0),
                gstPerPiece: Math.max(0, parseFloat(it.gstPerPiece) || 0),
                assetType: it.assetType,
                assetBrand: it.assetBrand,
                assetModel: it.assetModel,
              }))
            : [],

        assetIds: assetMode === 'INVENTORY' ? formData.assetIds : [],
        monthlyRate: assetMode === 'MANUAL' ? totalMonthlyRunrate : parseFloat(formData.monthlyRate) || 0,

        startDate: formData.startDate,
        endDate: formData.endDate ? formData.endDate : undefined,
        billingCycle: formData.billingCycle,
        securityDeposit: parseFloat(formData.securityDeposit) || 0,
        deliveryAddress: (formData.deliveryAddress || formData.customerAddress).trim(),
        agreementRef: formData.agreementRef,
      };

      const res = await fetch('/api/hardware/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        // Reset form
        setFormData({
          customerName: '',
          customerPhone: '',
          customerAltPhone: '',
          customerAddress: '',
          customerId: customers[0]?.id || '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          billingCycle: 'MONTHLY',
          securityDeposit: '',
          deliveryAddress: '',
          agreementRef: '',
          assetIds: [],
          monthlyRate: '2360',
        });
        setProductItems([createEmptyProductItem()]);
        fetchOrders();
        fetchDependencies();
      } else {
        alert(data.error || 'Failed to create rental order');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error creating rental order: ' + (err.message || 'Network error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppendItemsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToAddItems) return;

    for (let i = 0; i < appendItems.length; i++) {
      const it = appendItems[i];
      if (!it.systemConfiguration.trim()) {
        alert(`Product #${i + 1}: Please enter the system configuration specs.`);
        return;
      }
      if ((parseFloat(it.rentPerPiece) || 0) <= 0) {
        alert(`Product #${i + 1}: Please enter a valid rent per piece.`);
        return;
      }
    }

    setAppending(true);
    try {
      const payload = {
        items: appendItems.map((it) => ({
          systemConfiguration: it.systemConfiguration.trim(),
          quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
          rentPerPiece: Math.max(0, parseFloat(it.rentPerPiece) || 0),
          gstPerPiece: Math.max(0, parseFloat(it.gstPerPiece) || 0),
          assetType: it.assetType,
          assetBrand: it.assetBrand,
          assetModel: it.assetModel,
        })),
      };

      const res = await fetch(`/api/hardware/rentals/${orderToAddItems.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setOrderToAddItems(null);
        setAppendItems([createEmptyProductItem()]);
        fetchOrders();
        fetchDependencies();
      } else {
        alert(data.error || 'Failed to add items to order');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error adding products: ' + (err.message || 'Network error'));
    } finally {
      setAppending(false);
    }
  };

  const handleOpenEditModal = (order: RentalOrder) => {
    const meta = parseRentalMetadata(order.agreementRef);
    const altPhone = extractAltPhone(order.customer?.notes, meta?.customerAltPhone);
    const hasMultiItems = Array.isArray(meta?.items) && meta.items.length > 0;

    let initialItems: ProductItemState[] = [];
    if (hasMultiItems) {
      initialItems = meta!.items!.map((it) => ({
        id: Math.random().toString(36).substring(2, 9),
        systemConfiguration: it.systemConfiguration || '',
        quantity: String(it.quantity || 1),
        rentPerPiece: String(it.rentPerPiece || 0),
        gstPerPiece: String(it.gstPerPiece || 0),
        assetType: it.assetType || 'WORKSTATION',
        assetBrand: it.assetBrand || 'Custom / Assembled',
        assetModel: it.assetModel || 'Rental System',
      }));
    } else if (meta?.systemConfiguration) {
      initialItems = [
        {
          id: Math.random().toString(36).substring(2, 9),
          systemConfiguration: meta.systemConfiguration,
          quantity: String(meta.totalQuantity || meta.quantity || order.items?.length || 1),
          rentPerPiece: String(meta.rentPerPiece || order.monthlyRate),
          gstPerPiece: String(meta.gstPerPiece || 0),
          assetType: meta.assetType || 'WORKSTATION',
          assetBrand: meta.assetBrand || 'Custom / Assembled',
          assetModel: meta.assetModel || 'Rental System',
        },
      ];
    } else if (order.items && order.items.length > 0) {
      initialItems = order.items.map((it) => ({
        id: Math.random().toString(36).substring(2, 9),
        systemConfiguration:
          it.asset?.specs || `${it.asset?.brand || ''} ${it.asset?.model || ''}`.trim() || 'Rental Hardware',
        quantity: '1',
        rentPerPiece: String(it.rate || Math.round(order.monthlyRate / order.items.length)),
        gstPerPiece: '0',
        assetType: it.asset?.assetType || 'WORKSTATION',
        assetBrand: it.asset?.brand || 'Dell / HP',
        assetModel: it.asset?.model || 'Rental System',
      }));
    } else {
      initialItems = [createEmptyProductItem()];
    }

    setEditFormData({
      customerName: meta?.customerName || order.customer?.name || '',
      customerPhone: meta?.customerPhone || order.customer?.phone || '',
      customerAltPhone: altPhone || '',
      customerEmail: order.customer?.email || '',
      customerAddress: order.deliveryAddress || '',
      deliveryAddress: order.deliveryAddress || '',
      startDate: order.startDate ? new Date(order.startDate).toISOString().split('T')[0] : '',
      endDate: order.endDate ? new Date(order.endDate).toISOString().split('T')[0] : '',
      billingCycle: order.billingCycle || 'MONTHLY',
      securityDeposit: String(order.securityDeposit ?? 0),
      agreementRef:
        meta?.customRef ||
        (order.agreementRef && !order.agreementRef.trim().startsWith('{') ? order.agreementRef.trim() : '') ||
        '',
      status: order.status || 'ACTIVE',
      notes: order.customer?.notes || '',
    });
    setEditProductItems(initialItems);
    setEditingOrder(order);
  };

  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!editFormData.customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (!editFormData.customerPhone.trim()) {
      alert('Please enter customer phone');
      return;
    }
    if (editProductItems.length === 0) {
      alert('Please add at least one product item');
      return;
    }
    for (let i = 0; i < editProductItems.length; i++) {
      if (!editProductItems[i].systemConfiguration.trim()) {
        alert(`Product #${i + 1}: System configuration specs are required.`);
        return;
      }
    }

    setEditSubmitting(true);
    try {
      const payload = {
        status: editFormData.status,
        customerName: editFormData.customerName.trim(),
        customerPhone: editFormData.customerPhone.trim(),
        customerAltPhone: editFormData.customerAltPhone.trim(),
        customerEmail: editFormData.customerEmail.trim(),
        customerAddress: editFormData.customerAddress.trim(),
        deliveryAddress: (editFormData.deliveryAddress || editFormData.customerAddress).trim(),
        startDate: editFormData.startDate,
        endDate: editFormData.endDate ? editFormData.endDate : null,
        billingCycle: editFormData.billingCycle,
        securityDeposit: parseFloat(editFormData.securityDeposit) || 0,
        agreementRef: editFormData.agreementRef.trim(),
        customRef: editFormData.agreementRef.trim(),
        items: editProductItems.map((it) => ({
          systemConfiguration: it.systemConfiguration.trim(),
          quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
          rentPerPiece: Math.max(0, parseFloat(it.rentPerPiece) || 0),
          gstPerPiece: Math.max(0, parseFloat(it.gstPerPiece) || 0),
          assetType: it.assetType,
          assetBrand: it.assetBrand.trim(),
          assetModel: it.assetModel.trim(),
        })),
      };

      const res = await fetch(`/api/hardware/rentals/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setEditingOrder(null);
        fetchOrders();
        fetchDependencies();
        if (viewOrder?.id === editingOrder.id) {
          setViewOrder(data.order);
        }
      } else {
        alert(data.error || 'Failed to update rental order');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating rental order: ' + (err.message || 'Network error'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const addEditProductItem = () => {
    setEditProductItems((prev) => [...prev, createEmptyProductItem()]);
  };

  const removeEditProductItem = (id: string) => {
    if (editProductItems.length <= 1) {
      alert('An order must have at least one product item.');
      return;
    }
    setEditProductItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateEditProductItem = (id: string, field: keyof ProductItemState, value: string) => {
    setEditProductItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const setEditItemGstPct = (id: string, pct: number) => {
    setEditProductItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const rent = parseFloat(it.rentPerPiece) || 0;
          const calculatedGst = Math.round((rent * pct) / 100);
          return { ...it, gstPerPiece: String(calculatedGst) };
        }
        return it;
      })
    );
  };

  const applyPresetToEditItem = (id: string, preset: (typeof configPresets)[0]) => {
    setEditProductItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            assetType: preset.type,
            assetBrand: preset.brand,
            assetModel: preset.model,
            systemConfiguration: preset.specs,
            rentPerPiece: preset.rent,
            gstPerPiece: preset.gst,
          };
        }
        return it;
      })
    );
  };

  const editTotalHardwareDevices = editProductItems.reduce(
    (acc, it) => acc + (parseInt(it.quantity, 10) || 0),
    0
  );

  const editTotalMonthlyRunrate = editProductItems.reduce((acc, it) => {
    const q = parseInt(it.quantity, 10) || 0;
    const r = parseFloat(it.rentPerPiece) || 0;
    const g = parseFloat(it.gstPerPiece) || 0;
    return acc + q * (r + g);
  }, 0);

  // Open and load monthly payment tracking
  const openPaymentModal = async (order: RentalOrder) => {
    setOrderForPayments(order);
    setLoadingPayments(true);
    setPaymentData(null);
    try {
      const res = await fetch(`/api/hardware/rentals/${order.id}/payments`);
      const data = await res.json();
      if (data.success) {
        setPaymentData(data);
        const targetCycle = data.cycles?.find((c: any) => c.status !== 'PAID') || data.cycles?.[0];
        if (targetCycle) {
          setPaymentForm({
            cycleMonth: targetCycle.cycleMonth,
            cycleLabel: targetCycle.cycleLabel,
            expectedAmount: targetCycle.expectedAmount,
            payAmount: String(targetCycle.pendingAmount > 0 ? targetCycle.pendingAmount : targetCycle.expectedAmount),
            paymentMethod: 'UPI',
            paymentDate: new Date().toISOString().split('T')[0],
            transactionRef: '',
            invoiceNumber: '',
            notes: '',
          });
        }
      } else {
        alert(data.error || 'Failed to load payments');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching payment history');
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleSelectCycle = (cycle: any) => {
    setPaymentForm((prev) => ({
      ...prev,
      cycleMonth: cycle.cycleMonth,
      cycleLabel: cycle.cycleLabel,
      expectedAmount: cycle.expectedAmount,
      payAmount: String(cycle.pendingAmount > 0 ? cycle.pendingAmount : cycle.expectedAmount),
    }));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForPayments) return;
    const amount = parseFloat(paymentForm.payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    if (!paymentForm.cycleMonth) {
      alert('Please select a billing cycle month');
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await fetch(`/api/hardware/rentals/${orderForPayments.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleMonth: paymentForm.cycleMonth,
          payAmount: amount,
          paymentMethod: paymentForm.paymentMethod,
          paymentDate: paymentForm.paymentDate,
          transactionRef: paymentForm.transactionRef || undefined,
          invoiceNumber: paymentForm.invoiceNumber || undefined,
          notes: paymentForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Payment of ₹${amount.toLocaleString()} recorded successfully for ${paymentForm.cycleMonth}!`);
        const refreshRes = await fetch(`/api/hardware/rentals/${orderForPayments.id}/payments`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setPaymentData(refreshData);
        }
        fetchOrders();
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Open Equipment Discontinue & Return Modal
  const openDiscontinueModal = (order: RentalOrder) => {
    setOrderForDiscontinue(order);
    setDiscontinueForm({
      actionType: 'COMPLETE_RETURN',
      discontinueReason: 'Requirement completed / Client project finished',
      returnDate: new Date().toISOString().split('T')[0],
      returnCondition: 'GOOD',
      inspectionNotes: 'All hardware inspected. Working properly with original charger & accessories.',
      depositDeduction: '0',
      deductionReason: '',
      unpaidRentDeduction: '0',
      depositRefundStatus: 'REFUNDED',
      depositRefundPaymentMode: 'UPI',
      depositRefundRef: '',
    });
  };

  const handleDiscontinueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForDiscontinue) return;

    setDiscontinueSubmitting(true);
    try {
      const payload = {
        ...discontinueForm,
        returnDate: discontinueDate || discontinueForm.returnDate,
        actionType: (discontinueStatus as any) || discontinueForm.actionType,
        discontinueReason: discontinueReason || discontinueForm.discontinueReason,
        inspectionNotes: discontinueNotes || discontinueForm.inspectionNotes,
      };
      const res = await fetch(`/api/hardware/rentals/${orderForDiscontinue.id}/discontinue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          discontinueForm.actionType === 'COMPLETE_RETURN'
            ? `Order #${orderForDiscontinue.orderNumber} successfully marked as RETURNED. Assets are now returned to available inventory.`
            : `Discontinuation request submitted for Order #${orderForDiscontinue.orderNumber}.`
        );
        setOrderForDiscontinue(null);
        fetchOrders();
        fetchDependencies();
        if (viewOrder?.id === orderForDiscontinue.id) {
          setViewOrder((prev) => (prev ? { ...prev, status: discontinueForm.actionType === 'COMPLETE_RETURN' ? 'RETURNED' : 'DISCONTINUATION_REQUESTED' } : null));
        }
      } else {
        alert(data.error || 'Failed to process discontinuation');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit discontinuation');
    } finally {
      setDiscontinueSubmitting(false);
    }
  };

  const handleReturnOrder = async (orderId: string, orderNumber: string) => {
    if (
      !confirm(
        `Check in assets for order ${orderNumber}? This will mark the lease as RETURNED and release the hardware devices.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/hardware/rentals/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RETURNED' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        fetchDependencies();
        if (viewOrder?.id === orderId) {
          setViewOrder((prev) => (prev ? { ...prev, status: 'RETURNED' } : null));
        }
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (
      !confirm(
        `Are you sure you want to completely delete rental order ${orderNumber}? This action cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/hardware/rentals/${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        fetchDependencies();
        if (viewOrder?.id === orderId) setViewOrder(null);
      } else {
        alert(data.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAssetSelection = (id: string) => {
    setFormData((prev) => {
      const exists = prev.assetIds.includes(id);
      return {
        ...prev,
        assetIds: exists ? prev.assetIds.filter((a) => a !== id) : [...prev.assetIds, id],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-violet-500/20 border border-indigo-500/20 rounded-2xl text-indigo-500 dark:text-indigo-400">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              IT Hardware Rental Orders
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Multi-product customer fleet dispatch (Laptops, Desktops, Workstations, Monitors) & monthly billing
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchDependencies();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + New Rental Order
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Rental Orders</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active Leases</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.active}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Monthly Runrate</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{metrics.monthlyRunrate.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Security Deposits Held</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ₹{metrics.totalDeposits.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order #, customer name, phone, product specs, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Lease</option>
          <option value="RETURNED">Returned & Closed</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-3" />
            <p className="text-sm">Loading rental orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No rental orders found</p>
            <p className="text-sm text-slate-400 mt-1">
              Click &quot;+ New Rental Order&quot; to add customers and multiple rental products.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {orders.map((o) => {
              const meta = parseRentalMetadata(o.agreementRef);
              const altPhone = extractAltPhone(o.customer?.notes, meta?.customerAltPhone);
              const isManualOrder = Boolean(meta?.manual || meta?.systemConfiguration || meta?.items?.length);

              // Multi-product items resolution
              const hasMultiItems = Array.isArray(meta?.items) && meta.items.length > 0;
              const productList = hasMultiItems
                ? meta!.items!
                : meta?.systemConfiguration
                ? [
                    {
                      systemConfiguration: meta.systemConfiguration,
                      quantity: meta.quantity || 1,
                      rentPerPiece: meta.rentPerPiece || 0,
                      gstPerPiece: meta.gstPerPiece || 0,
                      assetType: meta.assetType || 'WORKSTATION',
                      assetBrand: meta.assetBrand || 'Custom',
                      assetModel: meta.assetModel || 'System',
                    },
                  ]
                : [];

              const totalDevicesCount =
                meta?.totalQuantity ||
                (hasMultiItems
                  ? meta!.items!.reduce((acc, it) => acc + (it.quantity || 1), 0)
                  : o.items?.length || meta?.quantity || 1);

              return (
                <div
                  key={o.id}
                  className="p-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-0.5 rounded text-sm">
                          {o.orderNumber}
                        </span>
                        {o.status === 'ACTIVE' ? (
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            Active Lease
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20">
                            {o.status}
                          </span>
                        )}
                        <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                          {o.billingCycle} Cycle
                        </span>
                        <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full">
                          Fleet: {totalDevicesCount} {totalDevicesCount > 1 ? 'Devices' : 'Device'}
                        </span>
                      </div>

                      {/* Customer Name & Numbers */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
                        <span className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                          <User className="w-4 h-4 text-indigo-500" />
                          {meta?.customerName || o.customer?.name}
                        </span>

                        {(meta?.customerPhone || o.customer?.phone) && (
                          <a
                            href={`tel:${meta?.customerPhone || o.customer?.phone}`}
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 font-mono tracking-wide"
                            title="Call Primary Phone"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{meta?.customerPhone || o.customer?.phone}</span>
                          </a>
                        )}

                        {altPhone && (
                          <a
                            href={`tel:${altPhone}`}
                            className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono tracking-wide hover:underline"
                            title="Call Alternative Mobile"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Alt: {altPhone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          ₹{o.monthlyRate.toLocaleString('en-IN')}/mo
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Deposit: ₹{o.securityDeposit.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* + Add Products to this existing customer's order */}
                        {o.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setOrderToAddItems(o);
                              setAppendItems([createEmptyProductItem()]);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                            title="Add more laptops, PCs or monitors to this customer's order"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            + Add Products
                          </button>
                        )}

                        <button
                          onClick={() => setViewOrder(o)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all cursor-pointer"
                          title="View Full Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openPaymentModal(o)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-xs"
                          title="Track Monthly Billing & Record Rent Payments"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Payments</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(o)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                          title="Edit Order Details & Hardware Specifications"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Edit</span>
                        </button>

                        {(o.status === 'ACTIVE' || o.status === 'DISCONTINUATION_REQUESTED') && (
                          <button
                            onClick={() => openDiscontinueModal(o)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/20 transition-all cursor-pointer shadow-xs"
                            title="Discontinue Equipment & Return Assets"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Products Fleet Breakdown Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Rented Products & Hardware Fleet:
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {productList.length > 0 ? `${productList.length} Product Models` : `${o.items?.length || 1} Device(s)`}
                      </span>
                    </div>

                    {productList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {productList.map((prod, pIdx) => {
                          const unitPrice = (prod.rentPerPiece || 0) + (prod.gstPerPiece || 0);
                          const lineTot = (prod.quantity || 1) * unitPrice;
                          return (
                            <div
                              key={pIdx}
                              className="p-2.5 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {prod.assetType === 'LAPTOP' ? (
                                    <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                                  ) : prod.assetType === 'MONITOR' ? (
                                    <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                                  ) : (
                                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                                  )}
                                  {prod.quantity}x {prod.assetBrand || 'System'} {prod.assetModel || ''}
                                </span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  ₹{lineTot.toLocaleString('en-IN')}/mo
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono line-clamp-2">
                                {prod.systemConfiguration}
                              </p>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span>Rent: ₹{(prod.rentPerPiece || 0).toLocaleString('en-IN')}/pc</span>
                                {(prod.gstPerPiece || 0) > 0 && (
                                  <span>+ GST: ₹{prod.gstPerPiece}/pc</span>
                                )}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  = ₹{unitPrice.toLocaleString('en-IN')}/unit
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                        {o.items?.[0]?.asset?.specs || 'Standard Hardware Configuration'}
                      </p>
                    )}

                    {/* Dispatched Device IDs */}
                    {o.items?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Assigned Serial Numbers ({o.items.length}):
                        </span>
                        {o.items.slice(0, 8).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded text-[10px]"
                          >
                            <span className="font-mono text-indigo-600 dark:text-indigo-300 font-medium">
                              {item.asset.assetCode}
                            </span>
                          </div>
                        ))}
                        {o.items.length > 8 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            +{o.items.length - 8} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dates & Address Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <strong>Period:</strong> {new Date(o.startDate).toLocaleDateString()} →{' '}
                        {o.endDate ? (
                          new Date(o.endDate).toLocaleDateString()
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 text-[11px]">
                            Ongoing (Open Lease)
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <strong>Address:</strong> {o.deliveryAddress}
                      </span>
                    </div>

                    {meta?.customRef && (
                      <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                        Ref: {meta.customRef}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CREATE ORDER MODAL (Supports Multi-Product Lines for Single Customer) */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500 dark:text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Create IT Hardware Rental Order
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add single customer and multiple rental products (10+ laptops, PCs, workstations) in one order
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* SECTION 1: CUSTOMER DETAILS */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/70">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      1. Customer Contact & Delivery Details
                    </h3>
                  </div>
                  {/* Customer Mode Tabs */}
                  <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('MANUAL')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        customerMode === 'MANUAL'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ✏️ Manual Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('EXISTING')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        customerMode === 'EXISTING'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      👥 Existing Customer
                    </button>
                  </div>
                </div>

                {customerMode === 'MANUAL' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Customer / Client Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar / Acme Infotech"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone / Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Alternative Mobile Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9811223344 (Office / Emergency Contact)"
                        value={formData.customerAltPhone}
                        onChange={(e) => setFormData({ ...formData, customerAltPhone: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Delivery / Setup Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Unit 402, DLF Cyber City, Tower B, Gurugram"
                        value={formData.customerAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerAddress: e.target.value,
                            deliveryAddress: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Select Existing Customer *
                      </label>
                      {customers.length === 0 ? (
                        <p className="text-xs text-amber-500">
                          No existing customers found. Switch to &quot;Manual Customer&quot; above.
                        </p>
                      ) : (
                        <select
                          value={formData.customerId}
                          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.companyName || c.company?.name ? `(${c.companyName || c.company?.name})` : ''} -{' '}
                              {c.phone || 'No Phone'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Alternative Mobile Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9811223344"
                        value={formData.customerAltPhone}
                        onChange={(e) => setFormData({ ...formData, customerAltPhone: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Delivery Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Office Suite 201, Noida Sector 62"
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: HARDWARE ASSETS & MULTI-PRODUCT LINES */}
              <div className="space-y-4 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        2. Hardware Products Fleet ({productItems.length} Product Models, {totalHardwareDevices} Total Units)
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Add different laptops, desktop PCs, monitors or servers with individual quantities and pricing
                      </p>
                    </div>
                  </div>

                  {/* Asset Mode Tabs */}
                  <div className="flex items-center p-1 bg-indigo-100 dark:bg-slate-800 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setAssetMode('MANUAL')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        assetMode === 'MANUAL'
                          ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ⚡ Custom Products List
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetMode('INVENTORY')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        assetMode === 'INVENTORY'
                          ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      📦 Inventory Selection
                    </button>
                  </div>
                </div>

                {assetMode === 'MANUAL' ? (
                  <div className="space-y-4">
                    {/* List of Product Items */}
                    {productItems.map((item, idx) => {
                      const itemRent = parseFloat(item.rentPerPiece) || 0;
                      const itemGst = parseFloat(item.gstPerPiece) || 0;
                      const itemQty = Math.max(1, parseInt(item.quantity, 10) || 1);
                      const unitRate = itemRent + itemGst;
                      const itemLineTotal = itemQty * unitRate;

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/90 dark:border-indigo-800/80 shadow-xs space-y-3.5 relative"
                        >
                          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-[11px] font-bold">
                                {idx + 1}
                              </span>
                              Product #{idx + 1} ({item.assetType})
                            </span>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                Subtotal: {itemQty} pcs × ₹{unitRate.toLocaleString('en-IN')} = ₹{itemLineTotal.toLocaleString('en-IN')}/mo
                              </span>
                              {productItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeProductItem(item.id)}
                                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                                  title="Remove this product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Quick Presets for this item */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                Quick Autofill Spec:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {configPresets.map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => applyPresetToItem(item.id, preset)}
                                  className="px-2 py-0.5 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-300 rounded-md transition-all text-left flex items-center gap-1 cursor-pointer"
                                >
                                  <span>{preset.title.split(' ')[0]} {preset.title.split(' ')[1]}</span>
                                  <span className="text-[9px] text-indigo-500 font-bold">
                                    ₹{preset.rent}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Specifications Textarea */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              System Specifications / Configuration *
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={item.systemConfiguration}
                              onChange={(e) =>
                                updateProductItem(item.id, 'systemConfiguration', e.target.value)
                              }
                              placeholder="e.g. Core i7 12th Gen | 16GB RAM | 512GB SSD | 15.6 FHD Display | Charger"
                              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Category, Brand, Model */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Device Category
                              </label>
                              <select
                                value={item.assetType}
                                onChange={(e) =>
                                  updateProductItem(item.id, 'assetType', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="LAPTOP">Laptop / Notebook</option>
                                <option value="DESKTOP">Desktop Computer</option>
                                <option value="WORKSTATION">Workstation PC</option>
                                <option value="MONITOR">Monitor / Display</option>
                                <option value="SERVER">Server / Rack</option>
                                <option value="ACCESSORY">IT Accessory / Peripheral</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Brand
                              </label>
                              <input
                                type="text"
                                value={item.assetBrand}
                                onChange={(e) =>
                                  updateProductItem(item.id, 'assetBrand', e.target.value)
                                }
                                placeholder="e.g. Dell / HP / Lenovo"
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Model Identifier
                              </label>
                              <input
                                type="text"
                                value={item.assetModel}
                                onChange={(e) =>
                                  updateProductItem(item.id, 'assetModel', e.target.value)
                                }
                                placeholder="e.g. Latitude 5430"
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Quantity, Rent per Piece, GST per Piece */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Quantity (Pieces) *
                              </label>
                              <input
                                type="number"
                                min={1}
                                required
                                value={item.quantity}
                                onChange={(e) =>
                                  updateProductItem(item.id, 'quantity', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Rent Per Piece (₹) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  required
                                  value={item.rentPerPiece}
                                  onChange={(e) =>
                                    updateProductItem(item.id, 'rentPerPiece', e.target.value)
                                  }
                                  className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                  GST Per Piece (₹)
                                </label>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setItemGstPct(item.id, 18)}
                                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                  >
                                    +18%
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => setItemGstPct(item.id, 0)}
                                    className="text-[10px] text-slate-500 hover:underline font-medium"
                                  >
                                    0%
                                  </button>
                                </div>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.gstPerPiece}
                                  onChange={(e) =>
                                    updateProductItem(item.id, 'gstPerPiece', e.target.value)
                                  }
                                  className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Button to Add More Products */}
                    <button
                      type="button"
                      onClick={addProductItem}
                      className="w-full py-2.5 border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      + Add Another Product / System (e.g. More Laptops, PCs or Monitors)
                    </button>

                    {/* Order Grand Total Summary */}
                    <div className="p-3.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                          Total Fleet Summary:
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          {totalHardwareDevices} Hardware Units across {productItems.length} Product Models
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                          Grand Monthly Rental Runrate:
                        </span>
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          ₹{totalMonthlyRunrate.toLocaleString('en-IN')} / month
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select Available Inventory Assets ({formData.assetIds.length} selected) *
                    </label>

                    {availableAssets.length === 0 ? (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                        No devices are currently available in inventory. Switch to &quot;Custom Products List&quot; above to create and dispatch manually!
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900/60">
                        {availableAssets.map((asset) => {
                          const isSelected = formData.assetIds.includes(asset.id);
                          return (
                            <div
                              key={asset.id}
                              onClick={() => toggleAssetSelection(asset.id)}
                              className={`p-2.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-indigo-600/20 border border-indigo-500 text-indigo-200'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                                />
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                  {asset.assetCode}
                                </span>
                                <span>
                                  {asset.brand} {asset.model}
                                </span>
                              </div>
                              <span className="font-mono text-slate-400 text-[11px]">
                                S/N: {asset.serialNumber}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Total Monthly Rate (₹) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.monthlyRate}
                        onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: CONTRACT & BILLING TERMS */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    3. Rental Contract & Billing Terms
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rental Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rental End Date <span className="text-slate-400 font-normal">(Optional / Open Lease)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Billing Cycle
                    </label>
                    <select
                      value={formData.billingCycle}
                      onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="ANNUAL">Annual</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="DAILY">Daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Security Deposit <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="0 (Optional)"
                        value={formData.securityDeposit}
                        onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                        className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Agreement / PO Reference (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PO-2026-904 / Signed SLA"
                      value={formData.agreementRef}
                      onChange={(e) => setFormData({ ...formData, agreementRef: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Dispatch & Activate Rental Fleet ({totalHardwareDevices} Devices)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD PRODUCTS TO EXISTING RENTAL ORDER MODAL */}
      {/* ========================================================================= */}
      {orderToAddItems && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500 dark:text-indigo-400">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Add Products to Order: {orderToAddItems.orderNumber}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customer: <strong className="text-slate-800 dark:text-slate-200">{orderToAddItems.customer?.name}</strong> | Add more laptops, desktop PCs or monitors to their active lease
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderToAddItems(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAppendItemsSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-3.5">
                {appendItems.map((item, idx) => {
                  const itemRent = parseFloat(item.rentPerPiece) || 0;
                  const itemGst = parseFloat(item.gstPerPiece) || 0;
                  const itemQty = Math.max(1, parseInt(item.quantity, 10) || 1);
                  const unitRate = itemRent + itemGst;
                  const itemLineTotal = itemQty * unitRate;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-slate-800 pb-2">
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-[11px] font-bold">
                            {idx + 1}
                          </span>
                          New Product Item #{idx + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            + ₹{itemLineTotal.toLocaleString('en-IN')}/mo ({itemQty} pcs)
                          </span>
                          {appendItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAppendItem(item.id)}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {configPresets.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => applyPresetToAppendItem(item.id, preset)}
                            className="px-2 py-0.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-300 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>{preset.title.split(' ')[0]} {preset.title.split(' ')[1]}</span>
                            <span className="text-[9px] text-indigo-500 font-bold">₹{preset.rent}</span>
                          </button>
                        ))}
                      </div>

                      {/* Specs */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          System Specifications *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={item.systemConfiguration}
                          onChange={(e) =>
                            updateAppendItem(item.id, 'systemConfiguration', e.target.value)
                          }
                          placeholder="e.g. Core i7 12th Gen | 16GB RAM | 512GB SSD | 15.6 FHD Display"
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Type, Brand, Model */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Device Category
                          </label>
                          <select
                            value={item.assetType}
                            onChange={(e) =>
                              updateAppendItem(item.id, 'assetType', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="LAPTOP">Laptop / Notebook</option>
                            <option value="DESKTOP">Desktop Computer</option>
                            <option value="WORKSTATION">Workstation PC</option>
                            <option value="MONITOR">Monitor / Display</option>
                            <option value="SERVER">Server / Rack</option>
                            <option value="ACCESSORY">IT Accessory</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Brand
                          </label>
                          <input
                            type="text"
                            value={item.assetBrand}
                            onChange={(e) =>
                              updateAppendItem(item.id, 'assetBrand', e.target.value)
                            }
                            placeholder="e.g. Dell / HP"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Model Identifier
                          </label>
                          <input
                            type="text"
                            value={item.assetModel}
                            onChange={(e) =>
                              updateAppendItem(item.id, 'assetModel', e.target.value)
                            }
                            placeholder="e.g. Latitude 5430"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Qty, Rent, GST */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Quantity (Pieces) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.quantity}
                            onChange={(e) =>
                              updateAppendItem(item.id, 'quantity', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Rent Per Piece (₹) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={item.rentPerPiece}
                            onChange={(e) =>
                              updateAppendItem(item.id, 'rentPerPiece', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              GST Per Piece (₹)
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setAppendItemGstPct(item.id, 18)}
                                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                              >
                                +18%
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => setAppendItemGstPct(item.id, 0)}
                                className="text-[10px] text-slate-500 hover:underline font-medium"
                              >
                                0%
                              </button>
                            </div>
                          </div>
                          <input
                            type="number"
                            min={0}
                            value={item.gstPerPiece}
                            onChange={(e) =>
                              updateAppendItem(item.id, 'gstPerPiece', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addAppendItem}
                  className="w-full py-2.5 border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Add Another Product Item
                </button>
              </div>

              {/* Additional Runrate Banner */}
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    New Hardware Being Added:
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    +{appendTotalUnits} Units across {appendItems.length} Product Models
                  </strong>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    Monthly Rent Increase:
                  </span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    + ₹{appendTotalRunrate.toLocaleString('en-IN')}/mo
                  </strong>
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderToAddItems(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                >
                  {appending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Appending Devices...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm & Add {appendTotalUnits} Devices to Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW ORDER DETAILS MODAL */}
      {/* ========================================================================= */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Order Details: {viewOrder.orderNumber}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        viewOrder.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {viewOrder.status}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Created on {viewOrder.createdAt ? new Date(viewOrder.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {(() => {
                const meta = parseRentalMetadata(viewOrder.agreementRef);
                const altPhone = extractAltPhone(viewOrder.customer?.notes, meta?.customerAltPhone);
                const hasMultiItems = Array.isArray(meta?.items) && meta.items.length > 0;
                const productList = hasMultiItems
                  ? meta!.items!
                  : meta?.systemConfiguration
                  ? [
                      {
                        systemConfiguration: meta.systemConfiguration,
                        quantity: meta.quantity || 1,
                        rentPerPiece: meta.rentPerPiece || 0,
                        gstPerPiece: meta.gstPerPiece || 0,
                        assetType: meta.assetType || 'WORKSTATION',
                        assetBrand: meta.assetBrand || 'Custom',
                        assetModel: meta.assetModel || 'System',
                      },
                    ]
                  : [];

                const totalDevices =
                  meta?.totalQuantity ||
                  (hasMultiItems
                    ? meta!.items!.reduce((acc, it) => acc + (it.quantity || 1), 0)
                    : viewOrder.items?.length || meta?.quantity || 1);

                return (
                  <>
                    {/* Customer Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 space-y-3">
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-500" />
                        Customer Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Customer Name:</span>
                          <strong className="text-slate-900 dark:text-white text-sm">
                            {meta?.customerName || viewOrder.customer?.name}
                          </strong>
                          {viewOrder.customer?.company?.name && (
                            <span className="text-slate-400 block text-[11px]">
                              Company: {viewOrder.customer.company.name}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Primary Phone:</span>
                          {(meta?.customerPhone || viewOrder.customer?.phone) ? (
                            <a
                              href={`tel:${meta?.customerPhone || viewOrder.customer?.phone}`}
                              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                            >
                              {meta?.customerPhone || viewOrder.customer?.phone}
                            </a>
                          ) : (
                            <span>N/A</span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Alternative Mobile:</span>
                          {altPhone ? (
                            <strong className="text-amber-600 dark:text-amber-400">{altPhone}</strong>
                          ) : (
                            <span className="text-slate-400">None Provided</span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Delivery Address:</span>
                          <span>{viewOrder.deliveryAddress}</span>
                        </div>
                      </div>
                    </div>

                    {/* Products Fleet Breakdown */}
                    <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          Rented Hardware Fleet ({totalDevices} Units)
                        </h3>
                        <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-bold rounded-md text-[11px]">
                          {productList.length} Product Models
                        </span>
                      </div>

                      {productList.length > 0 ? (
                        <div className="space-y-2">
                          {productList.map((prod, pIdx) => {
                            const unitPrice = (prod.rentPerPiece || 0) + (prod.gstPerPiece || 0);
                            const lineTot = (prod.quantity || 1) * unitPrice;
                            return (
                              <div
                                key={pIdx}
                                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-1.5"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {prod.quantity}x {prod.assetBrand} {prod.assetModel} ({prod.assetType})
                                  </span>
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    ₹{lineTot.toLocaleString('en-IN')}/mo
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                                  {prod.systemConfiguration}
                                </p>
                                <div className="text-[10px] text-slate-400">
                                  Rate: ₹{prod.rentPerPiece}/pc + ₹{prod.gstPerPiece || 0} GST = ₹{unitPrice}/pc
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 font-mono text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {viewOrder.items?.[0]?.asset?.specs || 'Standard Hardware Configuration'}
                        </div>
                      )}

                      {/* Items */}
                      {viewOrder.items?.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-slate-400 text-[11px] font-semibold block">
                            Assigned Assets & Serial Numbers ({viewOrder.items.length}):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {viewOrder.items.map((item) => (
                              <div
                                key={item.id}
                                className="p-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">
                                    {item.asset.assetCode}
                                  </span>
                                  <span className="text-slate-400 text-[10px]">
                                    {item.asset.brand} {item.asset.model}
                                  </span>
                                </div>
                                <span className="font-mono text-slate-500 text-[11px]">
                                  S/N: {item.asset.serialNumber}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Financial Terms */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 space-y-3">
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-indigo-500" />
                        Commercials & Billing Details
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Monthly Runrate</span>
                          <strong className="text-sm font-bold text-slate-900 dark:text-white">
                            ₹{viewOrder.monthlyRate.toLocaleString('en-IN')}
                          </strong>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Security Deposit</span>
                          <strong className="text-sm font-bold text-amber-600 dark:text-amber-400">
                            ₹{viewOrder.securityDeposit.toLocaleString('en-IN')}
                          </strong>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Billing Cycle</span>
                          <strong className="text-sm font-bold text-slate-900 dark:text-white">
                            {viewOrder.billingCycle}
                          </strong>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Total Devices</span>
                          <strong className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {totalDevices} Pieces
                          </strong>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => handleDeleteOrder(viewOrder.id, viewOrder.orderNumber)}
                className="px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Order
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toPay = viewOrder;
                    openPaymentModal(toPay);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Monthly Payments
                </button>

                {(viewOrder.status === 'ACTIVE' || viewOrder.status === 'DISCONTINUATION_REQUESTED') && (
                  <button
                    type="button"
                    onClick={() => {
                      const toDisc = viewOrder;
                      openDiscontinueModal(toDisc);
                    }}
                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-xl border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Discontinue / Return
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewOrder;
                    setViewOrder(null);
                    handleOpenEditModal(toEdit);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Order
                </button>
                <button
                  type="button"
                  onClick={() => setViewOrder(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT RENTAL ORDER MODAL */}
      {/* ========================================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Edit Order: {editingOrder.orderNumber}
                    </h2>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        editingOrder.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {editingOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update customer contact details, rental dates, billing cycle, rates, and hardware configurations.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="max-h-[80vh] overflow-y-auto p-6 space-y-6 text-xs">
              {/* Order Status & Booking Ref Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Order Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE (Assets on rent)</option>
                    <option value="RETURNED">RETURNED (All items returned)</option>
                    <option value="COMPLETED">COMPLETED (Order concluded)</option>
                    <option value="CANCELLED">CANCELLED (Order voided)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Change order lifecycle state as necessary.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agreement / Booking Reference
                  </label>
                  <input
                    type="text"
                    value={editFormData.agreementRef}
                    onChange={(e) => setEditFormData({ ...editFormData, agreementRef: e.target.value })}
                    placeholder="e.g. AGR-2026-089 or PO-9844"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Internal PO reference or signed contract identifier.</p>
                </div>
              </div>

              {/* Section 1: Customer & Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>Customer & Contact Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Customer / Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.customerName}
                      onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                      placeholder="e.g. Ramesh Kumar / Acme Infotech"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editFormData.customerPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-amber-500" />
                        Alternative Mobile Number
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="tel"
                      value={editFormData.customerAltPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, customerAltPhone: e.target.value })}
                      placeholder="e.g. 9811223344 (Office / Emergency Contact)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={editFormData.customerEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                      placeholder="e.g. client@company.com"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Delivery & Setup Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.deliveryAddress}
                      onChange={(e) => setEditFormData({ ...editFormData, deliveryAddress: e.target.value })}
                      placeholder="e.g. Office Suite 201, Noida Sector 62, Uttar Pradesh"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Rental Dates & Financial Terms */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Rental Terms & Financials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rental Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rental End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Billing Cycle *
                    </label>
                    <select
                      value={editFormData.billingCycle}
                      onChange={(e) => setEditFormData({ ...editFormData, billingCycle: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="MONTHLY">MONTHLY (Every 30 Days)</option>
                      <option value="QUARTERLY">QUARTERLY (Every 3 Months)</option>
                      <option value="HALF_YEARLY">HALF_YEARLY (Every 6 Months)</option>
                      <option value="YEARLY">YEARLY (Annual Advance)</option>
                      <option value="ONE_TIME">ONE_TIME (Lump Sum / Project)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Security Deposit (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.securityDeposit}
                        onChange={(e) => setEditFormData({ ...editFormData, securityDeposit: e.target.value })}
                        className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Agreement / PO Reference
                    </label>
                    <input
                      type="text"
                      value={editFormData.agreementRef}
                      onChange={(e) => setEditFormData({ ...editFormData, agreementRef: e.target.value })}
                      placeholder="e.g. AGR-2026-081"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Calculated Total Monthly Rate
                    </span>
                    <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                      ₹{editTotalMonthlyRunrate.toLocaleString('en-IN')}/month
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Rented Products & Hardware Specifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Laptop className="w-4 h-4 text-indigo-500" />
                    <span>Hardware Products & Configurations ({editProductItems.length})</span>
                  </div>

                  <button
                    type="button"
                    onClick={addEditProductItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product Item
                  </button>
                </div>

                <div className="space-y-4">
                  {editProductItems.map((item, idx) => {
                    const rent = parseFloat(item.rentPerPiece) || 0;
                    const gst = parseFloat(item.gstPerPiece) || 0;
                    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
                    const unitRate = rent + gst;
                    const lineTotal = qty * unitRate;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative"
                      >
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
                          <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-[11px] font-bold">
                              {idx + 1}
                            </span>
                            Product #{idx + 1}: {item.assetType}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                              Subtotal: {qty} pcs × ₹{unitRate.toLocaleString('en-IN')} = ₹{lineTotal.toLocaleString('en-IN')}/mo
                            </span>

                            {editProductItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEditProductItem(item.id)}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-all cursor-pointer"
                                title="Delete this product line"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Presets */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            Quick Spec Presets:
                          </span>
                          {configPresets.map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => applyPresetToEditItem(item.id, preset)}
                              className="px-2 py-0.5 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-300 rounded-md transition-all text-left flex items-center gap-1 cursor-pointer"
                            >
                              <span>{preset.title.split(' ')[0]} {preset.title.split(' ')[1]}</span>
                              <span className="text-[9px] text-indigo-500 font-bold">₹{preset.rent}</span>
                            </button>
                          ))}
                        </div>

                        {/* Hardware Specifications */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            System Specifications / Configuration *
                          </label>
                          <textarea
                            required
                            rows={2}
                            value={item.systemConfiguration}
                            onChange={(e) => updateEditProductItem(item.id, 'systemConfiguration', e.target.value)}
                            placeholder="e.g. Core i7 12th Gen | 16GB RAM | 512GB NVMe SSD | 15.6 FHD Display | Charger"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Grid: Type, Brand, Model, Qty, Rent, GST */}
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-1">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Device Type
                            </label>
                            <select
                              value={item.assetType}
                              onChange={(e) => updateEditProductItem(item.id, 'assetType', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="LAPTOP">Laptop</option>
                              <option value="DESKTOP">Desktop PC</option>
                              <option value="MONITOR">Monitor</option>
                              <option value="WORKSTATION">Workstation</option>
                              <option value="SERVER">Server</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Brand
                            </label>
                            <input
                              type="text"
                              value={item.assetBrand}
                              onChange={(e) => updateEditProductItem(item.id, 'assetBrand', e.target.value)}
                              placeholder="e.g. Dell / HP"
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Model No.
                            </label>
                            <input
                              type="text"
                              value={item.assetModel}
                              onChange={(e) => updateEditProductItem(item.id, 'assetModel', e.target.value)}
                              placeholder="e.g. Latitude 5420"
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => updateEditProductItem(item.id, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Rent / Pc (₹) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.rentPerPiece}
                              onChange={(e) => updateEditProductItem(item.id, 'rentPerPiece', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              GST / Pc (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.gstPerPiece}
                              onChange={(e) => updateEditProductItem(item.id, 'gstPerPiece', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* GST % Shortcuts */}
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Apply GST:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const r = parseFloat(item.rentPerPiece) || 0;
                              updateEditProductItem(item.id, 'gstPerPiece', (Math.round(r * 0.18)).toString());
                            }}
                            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold rounded-md border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                          >
                            +18% GST (₹{Math.round((parseFloat(item.rentPerPiece) || 0) * 0.18)})
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEditProductItem(item.id, 'gstPerPiece', '0')}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            0% (Exempt)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Notes / Internal Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Remarks / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="e.g. Client requested delivery by 10 AM; GST billing requested."
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total Items: <strong className="text-slate-900 dark:text-white">{editProductItems.length}</strong> | Total Monthly Rate:{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                    ₹{editTotalMonthlyRunrate.toLocaleString('en-IN')}/mo
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    disabled={editSubmitting}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {editSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discontinue / Return Order Modal */}
      {selectedOrderForDiscontinue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Discontinue / Return Order
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Order #{selectedOrderForDiscontinue.orderNumber} &bull; {selectedOrderForDiscontinue.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDiscontinue(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">Hardware & Inventory Notice:</p>
                Marking status as <strong>Discontinued (Returned)</strong> will immediately set the order status to <strong>RETURNED</strong> and mark all assigned serial numbers/units back to <strong>AVAILABLE</strong> in your inventory.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Discontinuation Date
                  </label>
                  <input
                    type="date"
                    value={discontinueDate}
                    onChange={(e) => setDiscontinueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Order Status Update
                  </label>
                  <select
                    value={discontinueStatus}
                    onChange={(e) => setDiscontinueStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  >
                    <option value="RETURNED">Completed Return (Stock back to Inventory)</option>
                    <option value="DISCONTINUATION_REQUESTED">Discontinuation Notice / Pending Return</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Reason for Discontinuation
                </label>
                <select
                  value={discontinueReason}
                  onChange={(e) => setDiscontinueReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Select reason...</option>
                  <option value="Contract Ended / Project Completed">Contract Ended / Project Completed</option>
                  <option value="Client Downsizing / Budget Adjustment">Client Downsizing / Budget Adjustment</option>
                  <option value="Hardware Upgrade Requested">Hardware Upgrade Requested</option>
                  <option value="Client Purchased Own Equipment">Client Purchased Own Equipment</option>
                  <option value="Relocation / Remote Transition">Relocation / Remote Transition</option>
                  <option value="Dissatisfied with Performance">Dissatisfied with Performance</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Remarks / Handover Notes
                </label>
                <textarea
                  rows={3}
                  value={discontinueNotes}
                  onChange={(e) => setDiscontinueNotes(e.target.value)}
                  placeholder="Note device condition, charger/bag return status, or notice details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOrderForDiscontinue(null)}
                disabled={discontinueSubmitting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscontinueSubmit}
                disabled={discontinueSubmitting}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {discontinueSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirm Discontinuation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Payments & Invoicing Modal */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Monthly Payments & Invoices
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Order #{selectedOrderForPayment.orderNumber} &bull; {selectedOrderForPayment.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForPayment(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Order Billing Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Monthly Runrate</div>
                  <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                    ₹{Number(selectedOrderForPayment.monthlyRent || 0).toLocaleString('en-IN')}/mo
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Security Deposit</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    ₹{Number(selectedOrderForPayment.securityDeposit || 0).toLocaleString('en-IN')}
                    <span className="ml-1 text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800">
                      {selectedOrderForPayment.depositStatus}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Billing Cycle</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Day {selectedOrderForPayment.billingCycleDay || 1} of month
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Rental Period</div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formatDate(selectedOrderForPayment.startDate)} &rarr; {selectedOrderForPayment.endDate ? formatDate(selectedOrderForPayment.endDate) : 'Ongoing'}
                  </div>
                </div>
              </div>

              {/* Record New Payment Form */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-500" />
                    Record New Payment / Invoice
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Billing Month / Period *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. October 2026"
                      value={paymentForm.billingMonth}
                      onChange={(e) => setPaymentForm({ ...paymentForm, billingMonth: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Amount Due (₹) *
                    </label>
                    <input
                      type="number"
                      value={paymentForm.amountDue}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountDue: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Amount Paid (₹)
                    </label>
                    <input
                      type="number"
                      value={paymentForm.amountPaid}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={paymentForm.dueDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Paid Date
                    </label>
                    <input
                      type="date"
                      value={paymentForm.paidDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Status
                    </label>
                    <select
                      value={paymentForm.status}
                      onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="PAID">PAID</option>
                      <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                      <option value="PENDING">PENDING</option>
                      <option value="OVERDUE">OVERDUE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CASH">Cash</option>
                      <option value="CREDIT_CARD">Card / Payment Gateway</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Transaction / UTR Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR12345678"
                      value={paymentForm.transactionRef}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-001"
                      value={paymentForm.invoiceNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, invoiceNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Remarks / Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    disabled={paymentSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {paymentSubmitting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Payment Records History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Payment History ({selectedOrderForPayment.payments?.length || 0})
                </h4>

                {(!selectedOrderForPayment.payments || selectedOrderForPayment.payments.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500">No payment records recorded yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Fill out the form above to record monthly invoices and payments.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedOrderForPayment.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {p.billingMonth}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : p.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                            }`}>
                              {p.status}
                            </span>
                            {p.invoiceNumber && (
                              <span className="text-[11px] font-mono text-slate-400">
                                #{p.invoiceNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {p.dueDate && <span>Due: {formatDate(p.dueDate)}</span>}
                            {p.paidDate && <span>Paid: {formatDate(p.paidDate)}</span>}
                            {p.paymentMethod && <span>via {p.paymentMethod}</span>}
                            {p.transactionRef && <span className="font-mono">Ref: {p.transactionRef}</span>}
                          </div>
                          {p.notes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                              "{p.notes}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-slate-400">Paid / Due</div>
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                              <span className="text-emerald-600 dark:text-emerald-400">
                                ₹{Number(p.amountPaid || 0).toLocaleString('en-IN')}
                              </span>
                              {' / '}
                              <span className="text-slate-500">
                                ₹{Number(p.amountDue || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOrderForPayment(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
