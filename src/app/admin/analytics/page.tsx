'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Laptop,
  Sparkles,
  LifeBuoy,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface AnalyticsData {
  financials: {
    totalInvoiced: number;
    realizedRevenue: number;
    outstandingReceivables: number;
    totalExpenses: number;
    netCashflow: number;
  };
  sales: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: string;
    activeDealsCount: number;
    pipelineValue: number;
    wonRevenue: number;
    wonDealsCount: number;
  };
  saas: {
    activeSubscriptions: number;
    mrr: number;
    arr: number;
  };
  hardware: {
    totalFleet: number;
    rentedAssetsCount: number;
    fleetUtilization: string;
    rentalMonthlyRunrate: number;
    activeRentalsCount: number;
  };
  operations: {
    activeProjectsCount: number;
    totalProjectsCount: number;
    completedTasks: number;
    totalTasks: number;
    totalBillableHours: number;
  };
  workforce: {
    activeEmployees: number;
    presentToday: number;
    pendingLeaves: number;
    totalPayroll: number;
  };
  support: {
    openTickets: number;
    urgentTickets: number;
    resolvedTickets: number;
    totalTickets: number;
  };
}

export default function BusinessAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FINANCE' | 'SALES' | 'HARDWARE' | 'SAAS' | 'OPS'>('OVERVIEW');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
        Aggregating business performance metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Business OS Executive Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Real-time consolidated operational and financial intelligence across all divisions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          <span>Live Database Aggregation</span>
        </div>
      </div>

      {/* Top 4 Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Realized Cash */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Realized Cash Inflow</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            ₹{data.financials.realizedRevenue.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Net Flow: ₹{data.financials.netCashflow.toLocaleString()}</span>
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Active Sales Pipeline</span>
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            ₹{data.sales.pipelineValue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {data.sales.activeDealsCount} qualified deals in pipeline
          </div>
        </div>

        {/* SaaS MRR */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>SaaS Monthly Recurring</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            ₹{data.saas.mrr.toLocaleString()}/mo
          </div>
          <div className="text-xs text-indigo-400 mt-2">
            ARR Runrate: ₹{data.saas.arr.toLocaleString()}
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>IT Rental Fleet In Use</span>
            <Laptop className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {data.hardware.fleetUtilization}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {data.hardware.rentedAssetsCount} of {data.hardware.totalFleet} devices deployed
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {(['OVERVIEW', 'FINANCE', 'SALES', 'HARDWARE', 'SAAS', 'OPS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Finance Snapshot */}
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-400" /> Finance & Receivables
              </h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Total Invoiced:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{data.financials.totalInvoiced.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Realized Collections:</span>
                <span className="font-bold text-emerald-400">₹{data.financials.realizedRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Outstanding Receivables:</span>
                <span className="font-bold text-amber-400">₹{data.financials.outstandingReceivables.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Total Operating Expenses:</span>
                <span className="font-bold text-rose-400">₹{data.financials.totalExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Sales & CRM */}
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Sales Funnel & Pipeline
              </h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Total Inbound Leads:</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.sales.totalLeads}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Converted Customers:</span>
                <span className="font-bold text-emerald-400">{data.sales.convertedLeads}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Lead-to-Customer Win Rate:</span>
                <span className="font-bold text-violet-400">{data.sales.conversionRate}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Won Deals Revenue:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{data.sales.wonRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Workforce & Delivery */}
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Workforce & Delivery
              </h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Active Staff:</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.workforce.activeEmployees} members</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Present Today:</span>
                <span className="font-bold text-emerald-400">{data.workforce.presentToday} checked-in</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Deliverable Tasks Completed:</span>
                <span className="font-bold text-indigo-400">{data.operations.completedTasks} / {data.operations.totalTasks}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Billable Engineering Hours:</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.operations.totalBillableHours} hrs</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'FINANCE' && (
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Financial Statement & Accounts Receivable Ledger</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Gross Billed</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">₹{data.financials.totalInvoiced.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-emerald-400">Realized Cash</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">₹{data.financials.realizedRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-amber-400">Outstanding Due</span>
              <div className="text-xl font-bold text-amber-400 mt-1">₹{data.financials.outstandingReceivables.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-rose-400">Total Expenses</span>
              <div className="text-xl font-bold text-rose-400 mt-1">₹{data.financials.totalExpenses.toLocaleString()}</div>
            </div>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Net Operating Cash Balance</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">₹{data.financials.netCashflow.toLocaleString()}</div>
            </div>
            <span className="text-xs text-emerald-300">Audited from Payments vs Verified Expenses</span>
          </div>
        </div>
      )}

      {activeTab === 'SALES' && (
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sales Pipeline Health & Velocity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Pipeline Stage Value</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">₹{data.sales.pipelineValue.toLocaleString()}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.sales.activeDealsCount} Opportunities</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-emerald-400">Won Deals Revenue</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">₹{data.sales.wonRevenue.toLocaleString()}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.sales.wonDealsCount} Closed Won</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-violet-400">Inquiry Conversion</span>
              <div className="text-xl font-bold text-violet-400 mt-1">{data.sales.conversionRate}%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.sales.convertedLeads} of {data.sales.totalLeads} converted</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'HARDWARE' && (
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">IT Hardware Rental Fleet Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Hardware Fleet Size</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.hardware.totalFleet} Devices</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">MacBooks, ThinkPads, Servers</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-amber-400">Active Rental Contracts</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{data.hardware.activeRentalsCount} Orders</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.hardware.rentedAssetsCount} Devices Out</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-emerald-400">Monthly Rental Runrate</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">₹{data.hardware.rentalMonthlyRunrate.toLocaleString()}/mo</div>
              <div className="text-xs text-emerald-500 mt-1">Utilization: {data.hardware.fleetUtilization}%</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SAAS' && (
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">SaaS Subscriptions & ARR Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Active Subscriptions</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.saas.activeSubscriptions} Accounts</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-violet-400">Monthly Recurring Revenue (MRR)</span>
              <div className="text-xl font-bold text-violet-400 mt-1">₹{data.saas.mrr.toLocaleString()}/mo</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-indigo-400">Annual Runrate (ARR)</span>
              <div className="text-xl font-bold text-indigo-400 mt-1">₹{data.saas.arr.toLocaleString()}/yr</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'OPS' && (
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Engineering Operations & Support Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Active Client Projects</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.operations.activeProjectsCount}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-emerald-400">Completed Tasks</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{data.operations.completedTasks} / {data.operations.totalTasks}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-amber-400">Open Tickets</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{data.support.openTickets}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-rose-400">Urgent SLA Queue</span>
              <div className="text-xl font-bold text-rose-400 mt-1">{data.support.urgentTickets}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
