import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import {
  Inbox,
  Briefcase,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Users,
  Building2,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  Clock,
  UserCheck2,
} from 'lucide-react';
import PasswordChangeModal from '@/components/admin/PasswordChangeModal';
import { CompanyDashboard } from '@/components/dashboard/CompanyDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/admin/login');
  }

  const role = (session.companyRole || '').toUpperCase();
  const isSuperAdmin = session.role === 'SUPER_ADMIN';

  // 1. Employee / Agent -> Personal Employee Dashboard
  if (!isSuperAdmin && !['OWNER', 'ADMIN', 'MANAGER'].includes(role)) {
    return (
      <div className="space-y-8">
        {session.mustChangePassword && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold">Security Notice:</span> You are currently using the initial seed password. Please update your password to secure the portal.
              </div>
            </div>
            <PasswordChangeModal buttonText="Change Password Now" />
          </div>
        )}
        <EmployeeDashboard session={session} />
      </div>
    );
  }

  // 2. Company Owner / Admin / Manager -> Company Operational Dashboard
  if (!isSuperAdmin && ['OWNER', 'ADMIN', 'MANAGER'].includes(role)) {
    return (
      <div className="space-y-8">
        {session.mustChangePassword && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold">Security Notice:</span> You are currently using the initial seed password. Please update your password to secure the portal.
              </div>
            </div>
            <PasswordChangeModal buttonText="Change Password Now" />
          </div>
        )}
        <CompanyDashboard session={session} />
      </div>
    );
  }

  // 3. Super Admin -> Platform Master Cockpit
  // Real data aggregation across Business OS
  const [
    totalEnquiries,
    newEnquiries,
    wonDeals,
    totalPayments,
    totalProjects,
    activeStaff,
    todayAttendance,
    recentEnquiries,
    recentLogs,
  ] = await Promise.all([
    db.enquiry.count(),
    db.enquiry.count({ where: { status: 'NEW' } }),
    db.deal.findMany({
      where: {
        OR: [
          { wonDate: { not: null } },
          { stage: { isWon: true } },
        ],
      },
      select: { value: true },
    }),
    db.payment.aggregate({ _sum: { amount: true } }),
    db.projectRecord.count({ where: { status: { in: ['IN_PROGRESS', 'ACTIVE'] } } }),
    db.employee.count({ where: { status: 'ACTIVE' } }),
    db.attendanceRecord.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { in: ['PRESENT', 'LATE'] },
      },
    }),
    db.enquiry.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    db.activityLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
  ]);

  const totalWonRevenue = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0);
  const totalCollectedRevenue = totalPayments._sum.amount || 0;
  const presenceRate = activeStaff > 0 ? Math.round((todayAttendance / activeStaff) * 100) : 100;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="space-y-8">
      {/* Forced Password Change Notice */}
      {session.mustChangePassword && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold">Security Notice:</span> You are currently using the initial seed password. Please update your password to secure the portal.
            </div>
          </div>
          <PasswordChangeModal buttonText="Change Password Now" />
        </div>
      )}

      {/* Role-Tailored Cockpit Switcher Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Role-Tailored Dashboards & Workspaces
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your operational cockpit or access your employee self-service desk.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/portal"
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Self-Service</span>
                <Clock className="w-4 h-4 text-violet-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                My ESS Portal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Web punch clock, attendance history, leave quotas, and payslips.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-violet-600">
              <span>Open Desk</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/admin/dashboards/manager"
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Team Leads</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Manager Cockpit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Live team presence, 1-click approvals queue, and team sales pipeline.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Team View</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/admin/dashboards/hr"
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">People Ops</span>
                <UserCheck2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                HR Operations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Company presence rate ({presenceRate}%), regularizations, and payroll readiness.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>HR Desk</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/admin/dashboards/executive"
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">C-Suite</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Executive Cockpit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Revenue runway, weighted pipeline forecasts, and delivery SLAs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-600">
              <span>Executive View</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Enterprise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <span>Total Revenue Realized</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatINR(totalCollectedRevenue)}
          </div>
          <div className="text-xs text-slate-400 font-medium">From verified collections</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <span>Won Deal Volume</span>
            <TrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatINR(totalWonRevenue)}
          </div>
          <div className="text-xs text-violet-600 font-medium">{wonDeals.length} Won contracts</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <span>Workforce Presence Today</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{presenceRate}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{todayAttendance} of {activeStaff} staff logged</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <span>Active Deliveries</span>
            <Briefcase className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalProjects}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Client projects in progress</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Enquiries */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Project Enquiries & Leads</h2>
            <Link href="/admin/enquiries" className="text-xs font-semibold text-violet-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>View All Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentEnquiries.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No enquiries recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentEnquiries.map((enq) => (
                <div key={enq.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{enq.name}</div>
                    <span className="text-xs text-slate-400">{enq.service || 'Software Service'} • {enq.email}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    enq.status === 'NEW' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {enq.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-Time Activity Stream */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Audit & Operations Log</h2>
            <Link href="/admin/activity" className="text-xs font-semibold text-violet-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>View Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No recent activity recorded.</div>
          ) : (
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-800 dark:text-slate-200 font-medium">
                      <span className="font-bold text-slate-900 dark:text-white">{log.action}</span> by {log.userEmail || 'System'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
