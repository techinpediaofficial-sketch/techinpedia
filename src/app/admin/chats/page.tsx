import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import AdminChatInboxClient from '@/components/admin/AdminChatInboxClient';

export const revalidate = 0;

export default async function AdminChatsPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/admin/login');
  }

  const initialSessions = await db.chatSession.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  // Convert Date objects to ISO strings for client prop serialization
  const formattedSessions = initialSessions.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Live Chat Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time chat inbox with instant SMTP email notification dispatch and MySQL database logging.
          </p>
        </div>
      </div>

      <AdminChatInboxClient initialSessions={formattedSessions} />
    </div>
  );
}
