const express = require('express')
const router = express.Router();

registerController = require('../controllers/registerController');

router.get('/', registerController.register_get);
router.post('/', registerController.register_post);

module.exports = router;