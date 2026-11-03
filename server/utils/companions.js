export const STARTER_COMPANION = 'ember';
export const WEEK_STREAK = 7;

export const COMPANIONS = [
  { id: 'ember', name: 'Ember', cost: 0, blurb: 'The first spark. Everyone starts here.' },
  { id: 'fox', name: 'Hearth Fox', cost: 80, blurb: 'Quiet, warm, and a little sly.' },
  { id: 'knight', name: 'Kindling Knight', cost: 120, blurb: 'Armor of dusk. Soft heart.' },
  { id: 'owl', name: 'Night Owl', cost: 200, blurb: 'Keeps watch while the fire sleeps.' },
];

export function catalog() {
  return COMPANIONS.map((c) => ({ ...c }));
}

export function ownedList(user) {
  const owned = Array.isArray(user.companions) && user.companions.length ? user.companions : [STARTER_COMPANION];
  return [...new Set(owned)];
}

export function equippedId(user) {
  const owned = ownedList(user);
  const equipped = user.equippedCompanion || STARTER_COMPANION;
  return owned.includes(equipped) ? equipped : STARTER_COMPANION;
}

export function findCompanion(id) {
  return COMPANIONS.find((c) => c.id === id) || null;
}

export function weekUnlocked(user) {
  return Number(user.currentStreak || 0) >= WEEK_STREAK || Number(user.longestStreak || 0) >= WEEK_STREAK;
}
