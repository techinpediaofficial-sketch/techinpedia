'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    mustChangePassword?: boolean;
    companyId?: string | null;
    companyName?: string | null;
    companyRole?: string | null;
    isTenant?: boolean;
    allowedModules?: string[];
  };
  sessionRole?: string;
  appRoleName?: string;
  userEmail?: string;
  userPermissions?: string[];
  isTenant?: boolean;
  companyName?: string;
  companyRole?: string;
  allowedModules?: string[];
  children: React.ReactNode;
}

export default function AdminShell({
  user,
  sessionRole,
  appRoleName,
  userEmail,
  userPermissions = [],
  isTenant = false,
  companyName,
  companyRole,
  allowedModules = [],
  children,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-200 overflow-x-hidden">
      <AdminSidebar
        userRole={sessionRole}
        appRoleName={appRoleName}
        userEmail={userEmail}
        userPermissions={userPermissions}
        isTenant={isTenant}
        companyName={companyName}
        companyRole={companyRole}
        allowedModules={allowedModules}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          user={user}
          isTenant={isTenant}
          companyName={companyName}
          companyRole={companyRole}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="p-3 sm:p-5 md:p-8 flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
