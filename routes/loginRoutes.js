const express = require('express')
const router = express.Router();

const loginController = require('../controllers/loginController');

router.get('/', loginController.login_get);

router.post('/', loginController.login_post);

module.exports = router;