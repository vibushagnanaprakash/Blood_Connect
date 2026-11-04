import Notification from '../models/Notification.js';

export const notify = (recipient, request, message, type = 'info') =>
  Notification.create({ recipient, request, message, type });

export const notifyMany = (recipients, request, message, type = 'info') =>
  recipients.length
    ? Notification.insertMany(recipients.map((recipient) => ({ recipient, request, message, type })))
    : Promise.resolve([]);
