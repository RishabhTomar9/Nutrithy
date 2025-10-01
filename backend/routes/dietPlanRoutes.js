const express = require('express');
const router = express.Router();
const dietPlanController = require('../controllers/dietPlanController');

// Protected routes (require authentication)
router.get('/',dietPlanController.getUserDietPlans);
router.post('/', dietPlanController.createDietPlan);
router.get('/:id', dietPlanController.getDietPlanById);
router.put('/:id', dietPlanController.updateDietPlan);
router.delete('/:id', dietPlanController.deleteDietPlan);

// Public route for shared diet plans
router.get('/shared/:id', dietPlanController.getSharedDietPlan);

module.exports = router;