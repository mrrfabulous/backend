import { Request, Response } from 'express';
import notificationService from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user!._id);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationService.markAsRead(notificationId);
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.user!._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

export const getPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const preferences = await notificationService.getPreferences(req.user!._id);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Failed to fetch notification preferences' });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const preferences = await notificationService.updatePreferences(req.user!._id, req.body);
    res.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Failed to update notification preferences' });
  }
};

export const sendTestEmail = async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.sendEmail(
      req.user!.email,
      'Test Email',
      '<h1>Test Email</h1><p>This is a test email from the Train Ticketing System.</p>'
    );
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ message: 'Failed to send test email' });
  }
};
