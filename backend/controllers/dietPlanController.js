const DietPlan = require('../models/DietPlan');

// Get all diet plans for a user
exports.getUserDietPlans = async (req, res) => {
  try {
    const uid = req.user.uid;
    const dietPlans = await DietPlan.find({ uid }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, dietPlans });
  } catch (error) {
    console.error('Error fetching diet plans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch diet plans' });
  }
};

// Create a new diet plan
exports.createDietPlan = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, formData, plan } = req.body;
    
    if (!name || !formData || !plan) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const newDietPlan = new DietPlan({
      uid,
      name,
      formData,
      plan
    });
    
    const savedPlan = await newDietPlan.save();
    res.status(201).json({ success: true, dietPlan: savedPlan });
  } catch (error) {
    console.error('Error creating diet plan:', error);
    res.status(500).json({ success: false, message: 'Failed to create diet plan' });
  }
};

// Get a specific diet plan
exports.getDietPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const dietPlan = await DietPlan.findById(id);
    
    if (!dietPlan) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }
    
    // Check if the plan belongs to the user or is shared publicly
    if (dietPlan.uid !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to diet plan' });
    }
    
    res.status(200).json({ success: true, dietPlan });
  } catch (error) {
    console.error('Error fetching diet plan:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch diet plan' });
  }
};

// Update a diet plan
exports.updateDietPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, formData, plan } = req.body;
    
    const dietPlan = await DietPlan.findById(id);
    
    if (!dietPlan) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }
    
    // Check if the plan belongs to the user
    if (dietPlan.uid !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to diet plan' });
    }
    
    const updatedDietPlan = await DietPlan.findByIdAndUpdate(
      id,
      { name, formData, plan },
      { new: true }
    );
    
    res.status(200).json({ success: true, dietPlan: updatedDietPlan });
  } catch (error) {
    console.error('Error updating diet plan:', error);
    res.status(500).json({ success: false, message: 'Failed to update diet plan' });
  }
};

// Delete a diet plan
exports.deleteDietPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const dietPlan = await DietPlan.findById(id);
    
    if (!dietPlan) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }
    
    // Check if the plan belongs to the user
    if (dietPlan.uid !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to diet plan' });
    }
    
    await DietPlan.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Diet plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting diet plan:', error);
    res.status(500).json({ success: false, message: 'Failed to delete diet plan' });
  }
};

// Get a shared diet plan (public access)
exports.getSharedDietPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const dietPlan = await DietPlan.findById(id);
    
    if (!dietPlan) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }
    
    // Remove sensitive information for shared plans
    const sharedPlan = {
      name: dietPlan.name,
      plan: dietPlan.plan,
      createdAt: dietPlan.createdAt
    };
    
    res.status(200).json({ success: true, dietPlan: sharedPlan });
  } catch (error) {
    console.error('Error fetching shared diet plan:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shared diet plan' });
  }
};