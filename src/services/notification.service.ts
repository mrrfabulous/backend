import nodemailer from 'nodemailer';
import { Notification } from '../models/notification.model';
import { User } from '../models/user.model';
import { NotificationPreferences } from '../models/notification-preferences.model';

class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }) {
    return await Notification.create({
      ...data,
      read: false,
      createdAt: new Date(),
    });
  }

  async getUserNotifications(userId: string) {
    return await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async markAsRead(notificationId: string) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string) {
    return await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
  }

  async getPreferences(userId: string) {
    let prefs = await NotificationPreferences.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreferences.create({
        userId,
        email: true,
        inApp: true,
        pushNotifications: false,
        journeyReminders: true,
        promotionalEmails: false,
      });
    }
    return prefs;
  }

  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    return await NotificationPreferences.findOneAndUpdate(
      { userId },
      { $set: preferences },
      { new: true, upsert: true }
    );
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Train Ticketing System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendBookingConfirmation(user: User, bookingDetails: any) {
    const prefs = await this.getPreferences(user._id);
    if (!prefs.email) return;

    const html = `
      <h1>Booking Confirmation</h1>
      <p>Dear ${user.firstName},</p>
      <p>Your train booking has been confirmed. Here are your booking details:</p>
      <ul>
        <li>Booking Reference: ${bookingDetails.reference}</li>
        <li>Train: ${bookingDetails.trainName}</li>
        <li>Date: ${new Date(bookingDetails.date).toLocaleDateString()}</li>
        <li>Time: ${bookingDetails.time}</li>
        <li>Seat(s): ${bookingDetails.seats.join(', ')}</li>
        <li>Amount: ₦${bookingDetails.amount.toFixed(2)}</li>
      </ul>
      <p>Thank you for choosing our service!</p>
    `;

    await this.sendEmail(user.email, 'Booking Confirmation', html);
    await this.createNotification({
      userId: user._id,
      type: 'BOOKING_CONFIRMATION',
      title: 'Booking Confirmed',
      message: `Your booking for ${bookingDetails.trainName} on ${new Date(bookingDetails.date).toLocaleDateString()} has been confirmed.`,
      metadata: bookingDetails,
    });
  }

  async sendPaymentConfirmation(user: User, paymentDetails: any) {
    const prefs = await this.getPreferences(user._id);
    if (!prefs.email) return;

    const html = `
      <h1>Payment Confirmation</h1>
      <p>Dear ${user.firstName},</p>
      <p>Your payment has been successfully processed. Here are the details:</p>
      <ul>
        <li>Payment Reference: ${paymentDetails.reference}</li>
        <li>Amount: ₦${paymentDetails.amount.toFixed(2)}</li>
        <li>Date: ${new Date(paymentDetails.date).toLocaleDateString()}</li>
      </ul>
      <p>Thank you for your payment!</p>
    `;

    await this.sendEmail(user.email, 'Payment Confirmation', html);
    await this.createNotification({
      userId: user._id,
      type: 'PAYMENT_CONFIRMATION',
      title: 'Payment Successful',
      message: `Your payment of ₦${paymentDetails.amount.toFixed(2)} has been confirmed.`,
      metadata: paymentDetails,
    });
  }

  async sendJourneyReminder(user: User, journeyDetails: any) {
    const prefs = await this.getPreferences(user._id);
    if (!prefs.journeyReminders) return;

    const html = `
      <h1>Journey Reminder</h1>
      <p>Dear ${user.firstName},</p>
      <p>This is a reminder about your upcoming train journey:</p>
      <ul>
        <li>Train: ${journeyDetails.trainName}</li>
        <li>Date: ${new Date(journeyDetails.date).toLocaleDateString()}</li>
        <li>Time: ${journeyDetails.time}</li>
        <li>Seat(s): ${journeyDetails.seats.join(', ')}</li>
      </ul>
      <p>Have a great journey!</p>
    `;

    await this.sendEmail(user.email, 'Journey Reminder', html);
    await this.createNotification({
      userId: user._id,
      type: 'JOURNEY_REMINDER',
      title: 'Upcoming Journey Reminder',
      message: `Your journey on ${journeyDetails.trainName} is scheduled for ${new Date(journeyDetails.date).toLocaleDateString()}.`,
      metadata: journeyDetails,
    });
  }
}

export default new NotificationService();
