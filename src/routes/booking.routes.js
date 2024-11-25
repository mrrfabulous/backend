const express = require('express');
const router = express.Router();
const Booking = require('../models/booking.model');
const Train = require('../models/train.model');
const User = require('../models/user.model');
const { auth } = require('../middleware/auth.middleware');
const { adminAuth } = require('../middleware/admin.middleware');
const { initializePayment, verifyPayment, initiateRefund } = require('../services/payment.service');
const { bookingConfirmationEmail, bookingCancellationEmail } = require('../services/email.service');

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const { trainId, seats } = req.body;
    
    // Input validation
    if (!trainId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Invalid booking data. Please provide trainId and seats array.' });
    }
    
    // Verify train exists and seats are available
    const train = await Train.findById(trainId);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    // Check if train departure time has passed
    if (new Date(train.departureTime) < new Date()) {
      return res.status(400).json({ message: 'Cannot book tickets for past trains' });
    }

    // Verify seat availability and calculate total amount
    let totalAmount = 0;
    const selectedSeats = [];
    const unavailableSeats = [];
    
    for (const seatNumber of seats) {
      const seat = train.seats.find(s => s.number === seatNumber);
      if (!seat) {
        unavailableSeats.push(seatNumber);
        continue;
      }
      if (!seat.isAvailable) {
        unavailableSeats.push(seatNumber);
        continue;
      }
      selectedSeats.push({
        number: seat.number,
        class: seat.class,
        price: seat.price
      });
      totalAmount += seat.price;
    }

    if (unavailableSeats.length > 0) {
      return res.status(400).json({ 
        message: 'Some seats are not available', 
        unavailableSeats 
      });
    }

    // Create booking
    const booking = new Booking({
      user: req.user.id,
      train: trainId,
      seats: selectedSeats,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Initialize payment
    const user = await User.findById(req.user.id);
    const paymentData = await initializePayment(booking, user);

    // Update booking with payment reference
    booking.paymentId = paymentData.reference;
    await booking.save();

    // Mark seats as temporarily unavailable
    train.seats = train.seats.map(seat => {
      if (seats.includes(seat.number)) {
        return { ...seat.toObject(), isAvailable: false };
      }
      return seat;
    });
    await train.save();

    res.status(201).json({
      booking,
      payment: {
        authorization_url: paymentData.authorization_url,
        reference: paymentData.reference
      }
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// Verify payment and confirm booking
router.post('/verify-payment/:reference', auth, async (req, res) => {
  try {
    const { reference } = req.params;
    const paymentData = await verifyPayment(reference);

    if (paymentData.status === 'success') {
      const booking = await Booking.findOne({ paymentId: reference })
        .populate('train')
        .populate('user');

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      booking.status = 'confirmed';
      booking.paymentStatus = 'completed';
      await booking.save();

      // Send confirmation email
      const user = await User.findById(booking.user);
      await bookingConfirmationEmail(booking, user);

      res.json({ message: 'Payment verified and booking confirmed', booking });
    } else {
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('train', 'name from to departureTime arrivalTime')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Get all bookings (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('train', 'name from to departureTime arrivalTime')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('train')
      .populate('user', 'name email phoneNumber');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (!booking.user.equals(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('train')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user owns the booking or is admin
    if (!booking.user.equals(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    const train = await Train.findById(booking.train);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    // Don't allow cancellation if less than 2 hours before departure
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (new Date(train.departureTime) - new Date() < TWO_HOURS) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking less than 2 hours before departure' 
      });
    }

    // Process refund if payment was completed
    if (booking.paymentStatus === 'completed') {
      try {
        await initiateRefund(booking);
        booking.paymentStatus = 'refunded';
      } catch (error) {
        console.error('Refund error:', error);
        return res.status(500).json({ message: 'Error processing refund' });
      }
    }

    // Update booking status
    booking.status = 'cancelled';
    
    // Release seats
    train.seats = train.seats.map(seat => {
      if (booking.seats.some(s => s.number === seat.number)) {
        return { ...seat.toObject(), isAvailable: true };
      }
      return seat;
    });

    await Promise.all([
      booking.save(),
      train.save()
    ]);

    // Send cancellation email
    await bookingCancellationEmail(booking, booking.user);

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
});

// Update booking status (admin only)
router.patch('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const updates = {};

    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('train').populate('user', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // If status is cancelled, release the seats
    if (status === 'cancelled') {
      const train = await Train.findById(booking.train);
      if (train) {
        train.seats = train.seats.map(seat => {
          if (booking.seats.some(s => s.number === seat.number)) {
            return { ...seat.toObject(), isAvailable: true };
          }
          return seat;
        });
        await train.save();
      }
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Error updating booking status' });
  }
});

module.exports = router;
