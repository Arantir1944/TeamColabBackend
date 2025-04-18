const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const callController = require('../controllers/callController');

router.use(authenticate);

// start / join / leave / end
router.post('/', callController.initiateCall);
router.post('/:callId/join', callController.joinCall);
router.post('/:callId/leave', callController.leaveCall);
router.post('/:callId/end', callController.endCall);

// list participants
router.get('/:callId/participants', callController.getCallParticipants);

module.exports = router;
