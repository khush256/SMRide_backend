const express = require('express');
const router = express.Router();
const Request = require('../models/request');
const User = require('../models/user');

//Create a new request
router.post('/', async (req, res) => {
    try {
        const { userId, location, time } = req.body;
        //Check if user exists
        const user = await User.findOne({ token: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const newRequest = new Request({
            userId,
            location,
            time
        });

        await newRequest.save();

        res.status(201).json({
            message: 'Request created successfully',
            request: {
                requestID: newRequest.requestID,
                userId: newRequest.userId,
                location: newRequest.location,
                createdAt: newRequest.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all requests (sorted by newest first)
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const requests = await Request.find({ userId: { $ne: token } }).sort({ createdAt: -1 });

        res.json(requests.map(request => ({
            requestID: request.requestID,
            userId: request.userId,
            location: request.location,
            time: request.time,
            createdAt: request.createdAt
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Get a specific request
router.get('/:requestID', async (req, res) => {
    try {
        const request = await Request.findOne({ requestID: req.params.requestID });
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({
            requestID: request.requestID,
            userId: request.userId,
            location: request.location,
            createdAt: request.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all requests for a user
router.get('/myrequest/:userID', async (req, res) => {
    try {
        const requests = await Request.find({ userId: req.params.userID }).sort({ createdAt: -1 });

        res.json(requests.map(request => ({
            requestID: request.requestID,
            location: request.location,
            time: request.time,
            createdAt: request.createdAt
        })
        ))
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Delete a request
router.delete('/:requestID', async (req, res) => {
    try {
        const request = await Request.deleteOne({
            requestID: req.params.requestID
        });
        if (!request) {
            return res.status(404).json({ error: 'Request not found' })
        }
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
