import { getAuthSession } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';
import SessionTracker from '@/components/admin/SessionTracker';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <AdminShell
        user={{
          id: session.userId,
          name: session.name || session.employeeName || session.email.split('@')[0],
          email: session.email,
          role: session.appRoleName || session.role,
          mustChangePassword: session.mustChangePassword,
          companyId: session.companyId,
          companyName: session.companyName,
          companyRole: session.companyRole,
          isTenant: session.isTenant,
          allowedModules: session.allowedModules,
        }}
        sessionRole={session.role}
        appRoleName={session.appRoleName || undefined}
        userEmail={session.email}
        userPermissions={session.permissions}
        isTenant={session.isTenant}
        companyName={session.companyName || undefined}
        companyRole={session.companyRole || undefined}
        allowedModules={session.allowedModules || []}
      >
        {children}
      </AdminShell>
      <SessionTracker />
    </>
  );
}
