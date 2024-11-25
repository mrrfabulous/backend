const Joi = require('joi');

const createBookingSchema = Joi.object({
  trainId: Joi.string().required(),
  seats: Joi.array().items(Joi.string()).min(1).required(),
  paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'upi').required(),
  paymentDetails: Joi.object({
    cardNumber: Joi.string().pattern(/^\d{16}$/),
    expiryMonth: Joi.string().pattern(/^\d{2}$/),
    expiryYear: Joi.string().pattern(/^\d{2}$/),
    cvv: Joi.string().pattern(/^\d{3}$/),
    upiId: Joi.string(),
  }).required(),
});

const updateBookingStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'cancelled', 'completed')
    .required(),
});

const bookingFilterSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  sortBy: Joi.string().valid('createdAt', 'status', 'totalAmount'),
  order: Joi.string().valid('asc', 'desc'),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
});

module.exports = {
  createBookingSchema,
  updateBookingStatusSchema,
  bookingFilterSchema,
};
