



const express = require('express');
const controllers = require('./controllers');

const router = express.Router();


router.get('/search', controllers.search);

router.get('/status', controllers.getStatus);
router.get('/test-deepl', controllers.testDeepL);
router.post('/save-result', controllers.saveGoogleResult);

// NEW: Get sync statistics
router.get('/sync-stats', controllers.getSyncStats);

module.exports = router;