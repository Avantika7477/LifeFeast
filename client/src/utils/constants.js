export const CATEGORIES = [
  'Health',
  'Fitness',
  'Study',
  'Coding',
  'Finance',
  'Meditation',
  'Reading',
  'Business',
  'Personal',
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const XP_MAP = { Easy: 10, Medium: 20, Hard: 40 };

export const CATEGORY_COLORS = {
  Health: '#06D6A0',
  Fitness: '#FF5D8F',
  Study: '#7C6CFF',
  Coding: '#8B5CF6',
  Finance: '#FFB703',
  Meditation: '#5EEAD4',
  Reading: '#FF7B54',
  Business: '#FB8500',
  Personal: '#38D9A9',
};

export const MOODS = ['😀', '😐', '😔', '😴', '😡'];

export const formatDate = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const combineDueAt = (dateStr, timeStr) => {
  if (!timeStr) return undefined;
  const day = dateStr || formatDate();
  const next = new Date(`${day}T${timeStr}`);
  if (Number.isNaN(next.getTime())) return undefined;
  return next.toISOString();
};

export const formatDue = (task) => {
  if (task?.dueAt) {
    return new Date(task.dueAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  if (task?.dueTime) return task.dueTime;
  if (task?.deadline) return new Date(task.deadline).toLocaleDateString();
  return '';
};

export const displayDate = (d = new Date()) =>
  new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const firstName = (name = '') => {
  const part = String(name).trim().split(/\s+/)[0];
  return part || 'hero';
};

export const questGreeting = (name) => {
  const hour = new Date().getHours();
  const who = firstName(name);
  if (hour < 12) return { kicker: 'Dawn patrol', title: `The quest begins, ${who}.` };
  if (hour < 17) return { kicker: 'Midday march', title: `Stay the course, ${who}.` };
  if (hour < 21) return { kicker: 'Evening fire', title: `Finish strong, ${who}.` };
  return { kicker: 'Night watch', title: `Rest is part of the quest, ${who}.` };
};

export const INSTALL_URL = 'https://lifefeast.vercel.app';

export const streakCopy = (days) => {
  const n = Number(days) || 0;
  if (n <= 0) return 'Light the first flame today';
  if (n === 1) return 'One day of showing up';
  return `${n} days of showing up`;
};
