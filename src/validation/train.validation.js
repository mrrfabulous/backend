const Joi = require('joi');

const seatSchema = Joi.object({
  number: Joi.string().required(),
  class: Joi.string().valid('economy', 'business', 'first').required(),
  price: Joi.number().min(0).required(),
  isAvailable: Joi.boolean().default(true),
});

const createTrainSchema = Joi.object({
  name: Joi.string().required(),
  from: Joi.string().required(),
  to: Joi.string().required(),
  departureTime: Joi.date().iso().required(),
  arrivalTime: Joi.date().iso().greater(Joi.ref('departureTime')).required(),
  basePrice: Joi.number().min(0).required(),
  seats: Joi.array().items(seatSchema).min(1).required(),
  status: Joi.string().valid('scheduled', 'cancelled', 'completed').default('scheduled'),
});

const updateTrainSchema = Joi.object({
  name: Joi.string(),
  from: Joi.string(),
  to: Joi.string(),
  departureTime: Joi.date().iso(),
  arrivalTime: Joi.date().iso(),
  basePrice: Joi.number().min(0),
  seats: Joi.array().items(seatSchema),
  status: Joi.string().valid('scheduled', 'cancelled', 'completed'),
}).min(1);

const searchTrainSchema = Joi.object({
  from: Joi.string(),
  to: Joi.string(),
  date: Joi.date().iso(),
  class: Joi.string().valid('all', 'economy', 'business', 'first'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(Joi.ref('minPrice')),
});

module.exports = {
  createTrainSchema,
  updateTrainSchema,
  searchTrainSchema,
};
