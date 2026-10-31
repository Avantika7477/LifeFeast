import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import { todayStr } from './helpers.js';
import { isCompletable } from './taskDue.js';

let configured = false;

export function vapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || '';
}

function configurePush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:lifequest@local',
      publicKey,
      privateKey
    );
    configured = true;
  }
  return true;
}

export function userHasOpenWork(tasks, habits, today) {
  const openTasks = (tasks || []).filter((t) => {
    if (t.status === 'completed') return false;
    if (t.dueAt) return isCompletable(t);
    return true;
  });
  const openHabits = (habits || []).filter(
    (h) => h.isActive !== false && !h.completions.some((c) => c.date === today)
  );
  return { openTasks, openHabits };
}

async function sendOne(sub, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(payload)
    );
    sub.lastSentAt = new Date();
    await sub.save();
    return true;
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await PushSubscription.deleteOne({ _id: sub._id });
    } else {
      console.warn(`Push failed: ${error.statusCode || error.message}`);
    }
    return false;
  }
}

export async function sendPushReminders() {
  if (!configurePush()) return { sent: 0, skipped: 'vapid-missing' };

  const today = todayStr();
  const subs = await PushSubscription.find();
  let sent = 0;

  for (const sub of subs) {
    if (sub.lastSentAt && Date.now() - sub.lastSentAt.getTime() < 4.5 * 60 * 1000) {
      continue;
    }
    const [tasks, habits] = await Promise.all([
      Task.find({ user: sub.user }),
      Habit.find({ user: sub.user, isActive: true }),
    ]);
    const { openTasks, openHabits } = userHasOpenWork(tasks, habits, today);
    const total = openTasks.length + openHabits.length;
    if (!total) continue;

    const lead = openHabits[0]?.name || openTasks[0]?.title || 'your quest';
    const ok = await sendOne(sub, {
      title: `You have not completed ${lead}`,
      body:
        total === 1
          ? `${lead} is still open. Open LifeQuest to mark it done.`
          : `${total} habits and tasks are still open. Open LifeQuest to finish them.`,
      url: openHabits.length ? '/habits' : '/tasks',
    });
    if (ok) sent += 1;
  }

  return { sent };
}

export async function sendPushToUser(userId, payload) {
  if (!configurePush()) return 0;
  const subs = await PushSubscription.find({ user: userId });
  let sent = 0;
  for (const sub of subs) {
    if (await sendOne(sub, payload)) sent += 1;
  }
  return sent;
}
