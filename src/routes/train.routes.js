const express = require('express');
const Train = require('../models/train.model');
const { auth } = require('../middleware/auth.middleware');
const { adminAuth } = require('../middleware/admin.middleware');

const router = express.Router();

// Create train (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const train = new Train(req.body);
    await train.save();
    res.status(201).json(train);
  } catch (error) {
    console.error('Create train error:', error);
    res.status(500).json({ message: 'Error creating train' });
  }
});

// Get all trains
router.get('/', async (req, res) => {
  try {
    const { from, to, date, class: trainClass } = req.query;
    let query = {};

    if (from) query.from = new RegExp(from, 'i');
    if (to) query.to = new RegExp(to, 'i');
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.departureTime = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    const trains = await Train.find(query);
    
    if (trainClass && trainClass !== 'all') {
      trains = trains.filter(train => 
        train.seats.some(seat => 
          seat.class === trainClass && seat.isAvailable
        )
      );
    }

    res.json(trains);
  } catch (error) {
    console.error('Get trains error:', error);
    res.status(500).json({ message: 'Error fetching trains' });
  }
});

// Get train by ID
router.get('/:id', async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    res.json(train);
  } catch (error) {
    console.error('Get train error:', error);
    res.status(500).json({ message: 'Error fetching train' });
  }
});

// Update train (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const train = await Train.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    res.json(train);
  } catch (error) {
    console.error('Update train error:', error);
    res.status(500).json({ message: 'Error updating train' });
  }
});

// Delete train (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const train = await Train.findByIdAndDelete(req.params.id);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    res.json({ message: 'Train deleted successfully' });
  } catch (error) {
    console.error('Delete train error:', error);
    res.status(500).json({ message: 'Error deleting train' });
  }
});

module.exports = router;
