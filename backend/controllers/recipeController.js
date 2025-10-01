const Recipe = require('../models/Recipe');

// Get all recipes
exports.getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
};

// Create a new recipe
exports.createRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.create(req.body);
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create recipe' });
  }
};

// Create an AI-generated recipe
exports.createAIRecipe = async (req, res) => {
  try {
    const { title, description, ingredients, cookTime, steps, createdAt } = req.body;
    
    // Validate required fields
    if (!title || !steps || !steps.length) {
      return res.status(400).json({ error: 'Title and steps are required' });
    }
    
    // Create the recipe
    const recipe = await Recipe.create({
      title,
      description,
      ingredients,
      cookTime,
      steps,
      createdAt: createdAt || new Date()
    });
    
    res.status(201).json(recipe);
  } catch (err) {
    console.error('Error creating AI recipe:', err);
    res.status(400).json({ error: 'Failed to create AI recipe' });
  }
};

// Get a recipe by ID
exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
};

// Update a recipe
exports.updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update recipe' });
  }
};

// Delete a recipe
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
};