import Notification from '../models/Notification.js';
import { wrap, httpError } from '../utils/helpers.js';

export const listNotifications = wrap(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
});

export const unreadCount = wrap(async (req, res) => {
  res.json({ count: await Notification.countDocuments({ recipient: req.user._id, read: false }) });
});

export const markRead = wrap(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true }, { new: true });
  if (!n) throw httpError(404, 'Notification not found');
  res.json({ notification: n });
});

export const markAllRead = wrap(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
});
