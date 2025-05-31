const express = require('express');
const path = require('path');

const router = express.Router();

// Basic routes
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

router.get('/network-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'network-test.html'));
});

router.get('/network-test2', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'network-test2.html'));
});

router.get('/network-test3', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'network-test3.html'));
});

router.get('/network-test4', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'network-test4.html'));
});

// Medieval.io route
router.get('/medieval-io', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'medieval-io.html'));
});

module.exports = router;
