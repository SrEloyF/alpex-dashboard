const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletter.controller');

router.get('/', newsletterController.getNewsletters);
router.post('/', newsletterController.createNewsletter);

module.exports = router;