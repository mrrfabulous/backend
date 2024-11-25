const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s-]+$/).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s-]+$/),
  currentPassword: Joi.string().min(6),
  newPassword: Joi.string().min(6),
}).min(1);

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};
