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
  Health: '#22C55E',
  Fitness: '#EF4444',
  Study: '#3B82F6',
  Coding: '#8B5CF6',
  Finance: '#F59E0B',
  Meditation: '#06B6D4',
  Reading: '#EC4899',
  Business: '#C9A227',
  Personal: '#14B8A6',
};

export const MOODS = ['😀', '😐', '😔', '😴', '😡'];

export const formatDate = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().slice(0, 10);
};

export const displayDate = (d = new Date()) =>
  new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
