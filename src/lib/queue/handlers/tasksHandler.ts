import { db } from '@/lib/db';
import { format, parse, isAfter, startOfDay } from 'date-fns';

export async function processRecurringTasks() {
  try {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const startOfToday = startOfDay(now);

    // Fetch all recurring tasks that haven't been reset today
    const recurringTasks = await db.staffTask.findMany({
      where: {
        isRecurring: true,
        OR: [
          { lastResetAt: { lt: startOfToday } },
          { lastResetAt: null }
        ]
      }
    });

    let resetCount = 0;

    for (const task of recurringTasks) {
      if (!task.recurringTime) continue;

      // Parse the recurring time (e.g. "09:00")
      try {
        const targetTimeStr = `${todayStr} ${task.recurringTime}`;
        const targetDate = parse(targetTimeStr, 'yyyy-MM-dd HH:mm', new Date());

        // If current time is past the target time, reset it
        if (isAfter(now, targetDate)) {
          await db.staffTask.update({
            where: { id: task.id },
            data: {
              status: 'TODO',
              completionNote: null,
              lastResetAt: now,
            }
          });
          resetCount++;
        }
      } catch (err) {
        console.error(`Error parsing recurring time for task ${task.id}:`, err);
      }
    }

    if (resetCount > 0) {
      console.log(`♻️ Reset ${resetCount} recurring daily tasks.`);
    }
  } catch (error) {
    console.error('Error processing recurring tasks:', error);
  }
}
