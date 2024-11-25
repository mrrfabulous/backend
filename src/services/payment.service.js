const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

const initializePayment = async (booking, user) => {
  try {
    const response = await paystack.transaction.initialize({
      email: user.email,
      amount: Math.round(booking.totalAmount * 100), // Convert to kobo
      reference: `booking_${booking._id}_${Date.now()}`,
      callback_url: `${process.env.FRONTEND_URL}/bookings/${booking._id}/payment-confirmation`,
      metadata: {
        booking_id: booking._id,
        user_id: user._id,
        custom_fields: [
          {
            display_name: "Booking ID",
            variable_name: "booking_id",
            value: booking._id
          },
          {
            display_name: "Train",
            variable_name: "train_name",
            value: booking.train.name
          }
        ]
      }
    });

    return response.data;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw new Error('Failed to initialize payment');
  }
};

const verifyPayment = async (reference) => {
  try {
    const response = await paystack.transaction.verify(reference);
    return response.data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new Error('Failed to verify payment');
  }
};

const initiateRefund = async (booking) => {
  try {
    // Find the transaction by reference
    const transactions = await paystack.transaction.list({
      customer: booking.user.email,
      perPage: 100
    });
    
    const transaction = transactions.data.data.find(
      t => t.reference.includes(booking._id)
    );

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const response = await paystack.refund.create({
      transaction: transaction.id,
      merchant_note: `Refund for booking ${booking._id}`
    });

    return response.data;
  } catch (error) {
    console.error('Refund initiation error:', error);
    throw new Error('Failed to initiate refund');
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  initiateRefund
};
