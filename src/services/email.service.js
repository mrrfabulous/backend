const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Failed to send email');
  }
};

const bookingConfirmationEmail = async (booking, user) => {
  const subject = `Booking Confirmation - Booking #${booking._id}`;
  const html = `
    <h1>Booking Confirmation</h1>
    <p>Dear ${user.name},</p>
    <p>Your booking has been confirmed. Here are the details:</p>
    <ul>
      <li>Booking ID: ${booking._id}</li>
      <li>Train: ${booking.train.name}</li>
      <li>From: ${booking.train.from}</li>
      <li>To: ${booking.train.to}</li>
      <li>Departure: ${new Date(booking.train.departureTime).toLocaleString()}</li>
      <li>Arrival: ${new Date(booking.train.arrivalTime).toLocaleString()}</li>
      <li>Seats: ${booking.seats.map(seat => seat.number).join(', ')}</li>
      <li>Total Amount: $${booking.totalAmount}</li>
    </ul>
    <p>You can view your booking details at: ${process.env.FRONTEND_URL}/bookings/${booking._id}</p>
    <p>Thank you for choosing our service!</p>
  `;

  return sendEmail({ to: user.email, subject, html });
};

const bookingCancellationEmail = async (booking, user) => {
  const subject = `Booking Cancellation - Booking #${booking._id}`;
  const html = `
    <h1>Booking Cancelled</h1>
    <p>Dear ${user.name},</p>
    <p>Your booking has been cancelled. Here are the details:</p>
    <ul>
      <li>Booking ID: ${booking._id}</li>
      <li>Train: ${booking.train.name}</li>
      <li>From: ${booking.train.from}</li>
      <li>To: ${booking.train.to}</li>
      <li>Departure: ${new Date(booking.train.departureTime).toLocaleString()}</li>
      <li>Refund Amount: $${booking.totalAmount}</li>
    </ul>
    <p>Your refund will be processed within 5-7 business days.</p>
    <p>Thank you for your understanding.</p>
  `;

  return sendEmail({ to: user.email, subject, html });
};

module.exports = {
  sendEmail,
  bookingConfirmationEmail,
  bookingCancellationEmail,
};
