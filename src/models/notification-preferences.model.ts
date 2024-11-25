import mongoose from 'mongoose';

const notificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  email: {
    type: Boolean,
    default: true,
  },
  inApp: {
    type: Boolean,
    default: true,
  },
  pushNotifications: {
    type: Boolean,
    default: false,
  },
  journeyReminders: {
    type: Boolean,
    default: true,
  },
  promotionalEmails: {
    type: Boolean,
    default: false,
  },
});

notificationPreferencesSchema.index({ userId: 1 });

export const NotificationPreferences = mongoose.model('NotificationPreferences', notificationPreferencesSchema);
