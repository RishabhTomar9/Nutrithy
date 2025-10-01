const express = require("express");
const verifyFirebaseToken = require("../auth/verifyFirebaseToken");
const recipeController = require("../controllers/recipeController");
const router = express.Router();

// GET all recipes
router.get("/", recipeController.getAllRecipes);

// POST a new recipe
router.post("/", verifyFirebaseToken, recipeController.createRecipe);

// POST an AI-generated recipe
router.post("/ai", recipeController.createAIRecipe);

// GET a recipe by ID
router.get("/:id", recipeController.getRecipeById);

// PUT update a recipe
router.put("/:id", verifyFirebaseToken, recipeController.updateRecipe);

// DELETE a recipe
router.delete("/:id", verifyFirebaseToken, recipeController.deleteRecipe);

module.exports = router;
