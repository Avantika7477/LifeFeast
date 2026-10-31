export function isCompletable(task) {
  if (!task?.dueAt) return true;
  const at = new Date(task.dueAt).getTime();
  if (Number.isNaN(at)) return true;
  return Date.now() >= at;
}

export function withCompletable(task) {
  const obj = typeof task.toObject === 'function' ? task.toObject() : { ...task };
  return { ...obj, completable: isCompletable(obj) };
}

export function formatDueLabel(task) {
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
}
