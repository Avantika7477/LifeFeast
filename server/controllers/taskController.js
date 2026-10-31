import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { formatDueLabel, isCompletable, withCompletable } from '../utils/taskDue.js';

export const getTasks = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const tasks = await Task.find(filter).sort({ dueAt: 1, deadline: 1, createdAt: -1 });
    res.json(tasks.map(withCompletable));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user._id });
    const when = formatDueLabel(task);
    await Notification.create({
      user: req.user._id,
      title: 'Task reminder',
      message: when
        ? `${task.title} is set for ${when}. Mark it done after that time.`
        : `${task.title} is on your quest log. Open it when you are ready to finish.`,
      type: 'reminder',
      meta: { taskId: task._id, type: task.type },
    });
    res.status(201).json(withCompletable(task));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const wantsComplete = req.body.status === 'completed' && task.status !== 'completed';
    if (wantsComplete && !isCompletable(task)) {
      const when = formatDueLabel(task);
      return res.status(400).json({
        message: when
          ? `Too early. You can mark this done after ${when}.`
          : 'Too early to mark this task complete.',
      });
    }

    Object.assign(task, req.body);
    await task.save();
    res.json(withCompletable(task));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
