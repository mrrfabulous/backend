const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  train: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Train',
    required: true
  },
  seats: [{
    number: String,
    class: {
      type: String,
      enum: ['economy', 'business', 'first']
    },
    price: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
