const express = require('express')
const router = express.Router();

const loginController = require('../controllers/loginController');

router.get('/', loginController.token_get);
router.post('/', loginController.token_post);

module.exports = router;