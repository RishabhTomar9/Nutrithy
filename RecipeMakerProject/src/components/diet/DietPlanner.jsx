import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Activity, Target, Clock, Droplet, RefreshCw, Coffee, Utensils, ChevronDown, ChevronUp, Heart, Flame, Zap, Bookmark, Share2, X, ShoppingCart, TrendingUp, ChefHat } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import axiosInstance from "../../utils/axiosInstance";
import { useAuth } from "../../hooks/useAuth";
import GroceryListGenerator from "./GroceryListGenerator";
import NutritionAnalytics from "./NutritionAnalytics";
import SmartRecipeSuggestions from "./SmartRecipeSuggestions";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const MODEL_NAME = "gemini-1.5-flash"; // Use Flash model for better rate limits
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export default function DietPlanner() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    activityLevel: "moderate",
    goal: "maintain",
    dietaryPreference: "omnivore",
    mealPreference: "",
    allergies: "",
    medicalConditions: "",
    fitnessLevel: "moderate",
  });
  const [loading, setLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState(null);
  const [activeSection, setActiveSection] = useState("form");
  const [savedPlans, setSavedPlans] = useState(() => {
    const saved = localStorage.getItem("savedDietPlans");
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [error, setError] = useState("");
  const [savingToBackend, setSavingToBackend] = useState(false);
  const [sharingPlan, setSharingPlan] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [mealProgress, setMealProgress] = useState({});
  const [dailyProgress, setDailyProgress] = useState(0);
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const dietPlanRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // GSAP animations setup
  useEffect(() => {
    if (dietPlan) {
      // Animate macros cards when they appear
      gsap.fromTo(".macro-card", 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "power2.out" }
      );
      
      // Animate meal sections with scroll trigger
      gsap.utils.toArray(".meal-section").forEach((section, i) => {
        gsap.fromTo(section, 
          { x: i % 2 === 0 ? -50 : 50, opacity: 0 },
          { 
            x: 0, 
            opacity: 1, 
            duration: 0.8,
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none none"
            }
          }
        );
      });
    }
  }, [dietPlan]);

  // Save plans to localStorage when they change
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem("savedDietPlans", JSON.stringify(savedPlans));
    }
  }, [savedPlans, currentUser]);
  
  // Load meal progress from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedProgress = localStorage.getItem(`mealProgress_${today}`);
    if (savedProgress) {
      setMealProgress(JSON.parse(savedProgress));
    }
  }, []);
  
  // Calculate daily progress
  useEffect(() => {
    if (dietPlan) {
      const totalMealItems = Object.values(dietPlan.meals).flat().length;
      const completedItems = Object.values(mealProgress).flat().filter(Boolean).length;
      setDailyProgress(totalMealItems > 0 ? (completedItems / totalMealItems) * 100 : 0);
    }
  }, [mealProgress, dietPlan]);
  
  // Save meal progress to localStorage and database
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem(`mealProgress_${today}`, JSON.stringify(mealProgress));
    
    // Also save to database if user is logged in
    if (currentUser && Object.keys(mealProgress).length > 0) {
      saveMealProgressToDatabase(mealProgress);
    }
  }, [mealProgress, currentUser]);
  
  // Save meal progress to database
  const saveMealProgressToDatabase = async (progressData) => {
    try {
      await axiosInstance.post('/api/meal-progress', {
        userId: currentUser.uid,
        date: new Date().toDateString(),
        progress: progressData,
        completionPercentage: dailyProgress
      });
    } catch (error) {
      console.error('Error saving meal progress to database:', error);
    }
  };
  
  // Fetch saved plans from backend for logged in users
  useEffect(() => {
    if (currentUser) {
      fetchSavedPlans();
    }
  }, [currentUser]);
  
  const fetchSavedPlans = async () => {
    if (!currentUser) return;
    
    try {
      const response = await axiosInstance.get('/api/diet-plans');
      if (response.data.success) {
        setSavedPlans(response.data.dietPlans);
      }
    } catch (error) {
      console.error('Error fetching saved diet plans:', error);
      // Fallback to localStorage if API fails
      const loadedPlans = localStorage.getItem("savedDietPlans");
      if (loadedPlans) {
        setSavedPlans(JSON.parse(loadedPlans));
      }
    }
  };

  const generateDietPlan = async () => {
    setLoading(true);
    setError("");
    setGenerationStatus("Initializing AI diet plan generation...");
    
    // Validate required form data
    if (!formData.age || !formData.weight || !formData.height) {
      setError("Please fill in your age, weight, and height to generate a personalized diet plan.");
      setLoading(false);
      return;
    }
    
    // Maximum number of retry attempts for rate limiting
    const MAX_RETRIES = 1; // Reduce retries to avoid quota exhaustion
    let retryCount = 0;
    let retryDelay = 60000; // Start with 60 seconds for rate limits
    
    const attemptGeneration = async () => {
      try {
        if (!API_KEY) {
          throw new Error('AI service is not configured. Please contact support to enable AI diet plan generation.');
        }

        setGenerationStatus("Connecting to AI nutrition expert...");
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        
        setGenerationStatus("Calculating your metabolic requirements...");

        // Calculate BMR and TDEE for more accurate calorie requirements
        const bmr = calculateBMR(parseInt(formData.age), parseFloat(formData.weight), parseFloat(formData.height));
        const tdee = calculateTDEE(bmr, formData.activityLevel);
        
        // Calculate goal-specific calories
        const goalCalories = formData.goal === 'lose' ? Math.round(tdee * 0.8) : 
                            formData.goal === 'gain' ? Math.round(tdee * 1.15) : 
                            Math.round(tdee);
        
        const prompt = `Create personalized diet plan for:
Age: ${formData.age}, Weight: ${formData.weight}kg, Height: ${formData.height}cm
TDEE: ${Math.round(tdee)} cal, Goal: ${formData.goal}, Diet: ${formData.dietaryPreference}
Allergies: ${formData.allergies || 'none'}, Activity: ${formData.activityLevel}

Return JSON:
{
  "calories": ${goalCalories},
  "macros": {"protein": number, "carbs": number, "fats": number},
  "hydration": "water intake recommendation",
  "meals": {
    "Breakfast": ["food with quantity", "food with quantity", "food with quantity"],
    "Lunch": ["food with quantity", "food with quantity", "food with quantity"],
    "Dinner": ["food with quantity", "food with quantity", "food with quantity"],
    "Snack": ["healthy snack with quantity", "alternative snack"]
  },
  "weeklyPlan": {
    "Monday": "daily focus", "Tuesday": "daily focus", "Wednesday": "daily focus",
    "Thursday": "daily focus", "Friday": "daily focus", "Saturday": "daily focus", "Sunday": "daily focus"
  },
  "exerciseRecommendations": ["exercise with duration", "exercise with duration", "rest day guidance"],
  "nutritionAnalysis": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "considerations": ["consideration 1", "consideration 2", "consideration 3"]
  },
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
}
        `;
        
        setGenerationStatus("Generating your personalized diet plan...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = await response.text();
        
        // Clean up the response text to extract JSON
        text = text.trim();
        if (text.includes('```json')) {
          text = text.split('```json')[1].split('```')[0].trim();
        } else if (text.includes('```')) {
          text = text.split('```')[1].split('```')[0].trim();
        }
        
        // Remove any markdown formatting or extra text
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}') + 1;
        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          text = text.substring(jsonStartIndex, jsonEndIndex);
        }

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          console.error('Raw AI Response:', text);
          throw new Error('Failed to parse AI response as JSON. Please try again.');
        }
        
        // Validate that all required fields are present
        const requiredFields = ['calories', 'macros', 'hydration', 'meals', 'weeklyPlan', 'exerciseRecommendations', 'nutritionAnalysis', 'tips'];
        const missingFields = requiredFields.filter(field => !parsed[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`AI response missing required fields: ${missingFields.join(', ')}. Please try again.`);
        }
        
        // Validate macros structure
        if (!parsed.macros.protein || !parsed.macros.carbs || !parsed.macros.fats) {
          throw new Error('AI response missing macro breakdown. Please try again.');
        }
        
        // Validate meals structure
        const requiredMeals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
        const missingMeals = requiredMeals.filter(meal => !parsed.meals[meal] || !Array.isArray(parsed.meals[meal]));
        
        if (missingMeals.length > 0) {
          throw new Error(`AI response missing meal plans for: ${missingMeals.join(', ')}. Please try again.`);
        }
        
        setGenerationStatus("Validating nutrition plan...");
        
        // Save the AI-generated plan with user data to database
        setGenerationStatus("Saving your personalized plan...");
        await saveDietPlanToDatabase(parsed);
        
        setGenerationStatus("Complete! Your AI diet plan is ready.");
        setDietPlan(parsed);
        setActiveSection("results");
        
        // Clear status after a short delay
        setTimeout(() => setGenerationStatus(""), 2000);
        return true; // Success
      } catch (err) {
        console.error("API Error:", err);
        
        // Check if it's a rate limit error (429)
        if (err.message && (err.message.includes("429") || err.message.includes("quota") || err.message.includes("rate limit"))) {
          // Extract retry delay from Google's response if available
          let suggestedDelay = 60; // Default 60 seconds
          if (err.message.includes('retryDelay')) {
            const retryMatch = err.message.match(/"retryDelay":"(\d+)s"/);
            if (retryMatch) {
              suggestedDelay = parseInt(retryMatch[1]);
            }
          }
          
          // For quota exceeded, don't retry - inform user immediately
          if (err.message.includes("quota") || err.message.includes("exceeded your current quota")) {
            throw new Error(`⚠️ Daily AI quota exceeded. The free tier has limited requests per day. Please try again tomorrow or consider upgrading your Google AI API plan.\n\n🕐 Service will reset at midnight Pacific time.\n\n💡 Tip: You can still use other features like progress tracking, grocery lists, and analytics!`);
          }
          
          // For regular rate limits, attempt retry if under limit
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const waitTime = Math.max(suggestedDelay, retryDelay / 1000);
            console.log(`Rate limit hit. Waiting ${waitTime} seconds before retry ${retryCount}/${MAX_RETRIES}`);
            setGenerationStatus(`⏱️ Rate limit hit. Waiting ${waitTime} seconds before retry...`);
            
            // Wait for the suggested delay
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            
            setGenerationStatus("Retrying AI generation...");
            return await attemptGeneration();
          } else {
            throw new Error(`⚠️ AI service rate limits exceeded. Please wait a few minutes before trying again.\n\n🕐 Free tier limits: 15 requests/minute, 1M tokens/day\n\n💡 Try again in 5-10 minutes when limits reset.`);
          }
        }
        
        // Handle other errors
        throw new Error("Failed to generate AI diet plan: " + err.message + ". Please check your information and try again.");
      }
    };
    
    try {
      await attemptGeneration();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      age: "",
      weight: "",
      height: "",
      activityLevel: "moderate",
      goal: "maintain",
      dietaryPreference: "omnivore",
      mealPreference: "",
      allergies: "",
      medicalConditions: "",
      fitnessLevel: "moderate",
    });
    setDietPlan(null);
    setActiveSection("form");
    setShowAdvancedOptions(false);
  };
  
  const savePlan = async () => {
    if (!dietPlan) return;
    
    const planToSave = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      name: `Diet Plan (${formData.goal}) - ${new Date().toLocaleDateString()}`,
      plan: dietPlan,
      formData: {...formData}
    };
    
    // Show save confirmation animation
    gsap.to(".save-confirmation", {
      opacity: 1, 
      y: 0, 
      duration: 0.5,
      onComplete: () => {
        setTimeout(() => {
          gsap.to(".save-confirmation", {opacity: 0, y: 10, duration: 0.5});
        }, 2000);
      }
    });
    
    if (currentUser) {
      // Save to backend if user is logged in
      try {
        setSavingToBackend(true);
        const response = await axiosInstance.post('/api/diet-plans', {
          name: planToSave.name,
          formData: planToSave.formData,
          plan: planToSave.plan
        });
        
        if (response.data.success) {
          // Refresh the saved plans list
          fetchSavedPlans();
        }
      } catch (error) {
        console.error('Error saving diet plan to backend:', error);
        // Fallback to localStorage if API fails
        setSavedPlans(prev => [planToSave, ...prev]);
      } finally {
        setSavingToBackend(false);
      }
    } else {
      // Save to localStorage if user is not logged in
      setSavedPlans(prev => [planToSave, ...prev]);
    }
  };
  
  const deleteSavedPlan = async (id) => {
    if (currentUser) {
      // Delete from backend if user is logged in
      try {
        const response = await axiosInstance.delete(`/api/diet-plans/${id}`);
        if (response.data.success) {
          // Refresh the saved plans list
          fetchSavedPlans();
        }
      } catch (error) {
        console.error('Error deleting diet plan from backend:', error);
      }
    } else {
      // Delete from localStorage if user is not logged in
      setSavedPlans(prev => prev.filter(plan => plan.id !== id));
    }
  };
  
  const loadSavedPlan = async (plan) => {
    if (currentUser && plan.id) {
      // Load from backend if user is logged in and we have an ID
      try {
        const response = await axiosInstance.get(`/api/diet-plans/${plan.id}`);
        if (response.data.success) {
          setFormData(response.data.dietPlan.formData);
          setDietPlan(response.data.dietPlan.plan);
          setActiveSection("results");
        }
      } catch (error) {
        console.error('Error loading diet plan from backend:', error);
        // Fallback to the plan object we already have
        setFormData(plan.formData);
        setDietPlan(plan.plan);
        setActiveSection("results");
      }
    } else {
      // Use the plan object directly
      setFormData(plan.formData);
      setDietPlan(plan.plan);
      setActiveSection("results");
    }
  };
  
  const toggleMealExpansion = (mealName) => {
    setExpandedMeal(expandedMeal === mealName ? null : mealName);
  };
  
  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions);
  };
  
  const toggleMealItem = (mealName, itemIndex) => {
    setMealProgress(prev => {
      const mealItems = prev[mealName] || [];
      const newMealItems = [...mealItems];
      newMealItems[itemIndex] = !newMealItems[itemIndex];
      return {
        ...prev,
        [mealName]: newMealItems
      };
    });
  };
  
  // Save diet plan to database with user data
  const saveDietPlanToDatabase = async (aiGeneratedPlan) => {
    if (!currentUser) {
      console.log('User not logged in, skipping database save');
      return;
    }
    
    try {
      const planData = {
        name: `AI Diet Plan - ${formData.goal} (${new Date().toLocaleDateString()})`,
        formData: {
          ...formData,
          generatedAt: new Date().toISOString(),
          bmr: Math.round(calculateBMR(parseInt(formData.age), parseFloat(formData.weight), parseFloat(formData.height))),
          tdee: Math.round(calculateTDEE(
            calculateBMR(parseInt(formData.age), parseFloat(formData.weight), parseFloat(formData.height)), 
            formData.activityLevel
          ))
        },
        plan: aiGeneratedPlan,
        generatedBy: 'AI',
        userId: currentUser.uid
      };
      
      const response = await axiosInstance.post('/api/diet-plans', planData);
      
      if (response.data.success) {
        console.log('Diet plan saved to database successfully');
        // Refresh saved plans list
        fetchSavedPlans();
      } else {
        console.error('Failed to save diet plan to database:', response.data.message);
      }
    } catch (error) {
      console.error('Error saving diet plan to database:', error);
      // Don't throw error here to avoid disrupting the user flow
    }
  };
  
  // Helper functions for BMR/TDEE calculation (moved outside AI function for reuse)
  const calculateBMR = (age, weight, height, gender = 'mixed') => {
    const baseBMR = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
  };
  
  const calculateTDEE = (bmr, activityLevel) => {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extreme: 1.9
    };
    return bmr * (multipliers[activityLevel] || 1.55);
  };
  

  
  const sharePlan = async () => {
    if (!dietPlan) return;
    
    try {
      setSharingPlan(true);
      
      if (currentUser) {
        // For logged in users, create a shareable link via backend
        const response = await axiosInstance.post('/api/diet-plans', {
          name: `Shared Diet Plan (${new Date().toLocaleDateString()})`,
          formData: { ...formData },
          plan: { ...dietPlan }
        });
        
        if (response.data.success) {
          const planId = response.data.dietPlan._id;
          const shareableUrl = `${window.location.origin}/shared-diet-plan/${planId}`;
          setShareUrl(shareableUrl);
          setShowShareModal(true);
        }
      } else {
        // For non-logged in users, create a temporary shareable link
        const planData = {
          name: `Shared Diet Plan (${new Date().toLocaleDateString()})`,
          formData: { ...formData },
          plan: { ...dietPlan }
        };
        
        // Store in localStorage with a unique ID
        const shareId = `share_${Date.now().toString()}`;
        const sharedPlans = JSON.parse(localStorage.getItem('sharedDietPlans') || '{}');
        sharedPlans[shareId] = planData;
        localStorage.setItem('sharedDietPlans', JSON.stringify(sharedPlans));
        
        const shareableUrl = `${window.location.origin}/shared-diet-plan?id=${shareId}`;
        setShareUrl(shareableUrl);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Error sharing diet plan:', error);
      setError('Failed to share diet plan. Please try again.');
    } finally {
      setSharingPlan(false);
    }
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        // Show copied notification
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy Link';
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };

  // Navigation tabs component
  const NavTabs = () => (
    <div className="flex justify-center mb-6 bg-gray-800 p-1 rounded-lg">
      {[
        { id: "form", label: "Create Plan", icon: Target },
        { id: "results", label: "Current Plan", icon: Utensils, disabled: !dietPlan },
        { id: "saved", label: "Saved Plans", icon: Bookmark }
      ].map(tab => (
        <motion.button
          key={tab.id}
          onClick={() => setActiveSection(tab.id)}
          disabled={tab.disabled}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === tab.id ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          whileHover={!tab.disabled ? { scale: 1.05 } : {}}
          whileTap={!tab.disabled ? { scale: 0.95 } : {}}
        >
          <tab.icon size={16} />
          {tab.label}
        </motion.button>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-10 pt-8 w-full mx-auto flex flex-col gap-8 max-w-7xl"
    >
      {/* Animated background gradient */}
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <motion.h2 
            className="text-3xl font-bold text-green-400 flex items-center gap-2"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Utensils size={28} className="text-green-500" /> 
            <span>AI Diet Planner</span>
          </motion.h2>
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <RefreshCw
              size={22}
              className="text-gray-400 cursor-pointer hover:text-green-500 transition-colors"
              onClick={resetForm}
            />
          </motion.div>
        </div>
        
        <motion.p 
          className="text-gray-400 mb-6 max-w-2xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Your personalized AI-powered nutrition assistant. Get customized meal plans, nutrition advice, and exercise recommendations tailored to your goals.
        </motion.p>
        
        <NavTabs />
      </div>
      
      {/* Save confirmation toast */}
      <div className="save-confirmation fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg opacity-0 translate-y-10 z-50">
        Plan saved successfully!
      </div>
      
      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full text-gray-800"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Share Your Diet Plan</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="mb-4 text-gray-600">Share this link with others to view your diet plan:</p>
            
            <div className="flex items-center mb-6">
              <input 
                type="text" 
                value={shareUrl} 
                readOnly 
                className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button 
                id="copy-btn"
                onClick={copyShareLink}
                className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-r-md transition-all"
              >
                Copy Link
              </button>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={() => setShowShareModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main content area */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {activeSection === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic form fields */}
                {[
                  { name: "age", label: "Age", icon: Calendar },
                  { name: "weight", label: "Weight (kg)", icon: Activity },
                  { name: "height", label: "Height (cm)", icon: Target },
                  { name: "activityLevel", label: "Activity Level", icon: Clock, select: true, options: ["sedentary","light","moderate","active","extreme"] },
                  { name: "goal", label: "Goal", icon: Target, select: true, options: ["lose","maintain","gain","muscle"] },
                  { name: "dietaryPreference", label: "Dietary Preference", icon: Utensils, select: true, options: ["vegan","vegetarian","omnivore","mix"] },
                  { name: "mealPreference", label: "Meal Preference", icon: Coffee, placeholder: "e.g., low-carb, high-protein, etc." },
                ].map(({ name, label, icon: Icon, select, options, placeholder }, index) => (
                  <motion.div 
                    key={name} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="form-field"
                  >
                    <label className="block mb-1 text-gray-300 font-medium">{label}</label>
                    <div className="flex items-center gap-2 bg-gray-800 rounded-md p-2 border border-gray-700 focus-within:border-green-500 transition-colors">
                      <Icon size={20} className="text-green-400" />
                      {select ? (
                        <select
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          className="bg-gray-800 flex-1 text-white outline-none px-2 py-1 rounded-md"
                        >
                          {options.map((o) => (
                            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          placeholder={placeholder || label}
                          className="bg-gray-800 flex-1 outline-none text-white px-2 py-1 rounded-md"
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {/* Advanced options toggle */}
                <motion.div 
                  className="md:col-span-2 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <button 
                    onClick={toggleAdvancedOptions}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
                  </button>
                </motion.div>
                
                {/* Advanced options */}
                <AnimatePresence>
                  {showAdvancedOptions && (
                    <>
                      {[
                        { name: "allergies", label: "Allergies", icon: Target, placeholder: "e.g., nuts, dairy, gluten" },
                        { name: "medicalConditions", label: "Medical Conditions", icon: Heart, placeholder: "e.g., diabetes, hypertension" },
                        { name: "fitnessLevel", label: "Fitness Level", icon: Activity, select: true, options: ["beginner","moderate","advanced"] },
                      ].map(({ name, label, icon: Icon, select, options, placeholder }, index) => (
                        <motion.div 
                          key={name} 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="form-field md:col-span-2 overflow-hidden"
                        >
                          <label className="block mb-1 text-gray-300 font-medium">{label}</label>
                          <div className="flex items-center gap-2 bg-gray-800 rounded-md p-2 border border-gray-700 focus-within:border-green-500 transition-colors">
                            <Icon size={20} className="text-green-400" />
                            {select ? (
                              <select
                                name={name}
                                value={formData[name]}
                                onChange={handleChange}
                                className="bg-gray-800 flex-1 text-white outline-none px-2 py-1 rounded-md"
                              >
                                {options.map((o) => (
                                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                name={name}
                                value={formData[name]}
                                onChange={handleChange}
                                placeholder={placeholder || label}
                                className="bg-gray-800 flex-1 outline-none text-white px-2 py-1 rounded-md"
                              />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </AnimatePresence>

                {/* Error message */}
              {error && (
                <motion.div 
                  className="md:col-span-2 p-4 bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg text-sm mt-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">⚠️</span>
                        <span className="font-medium">Generation Error</span>
                      </div>
                      <div className="whitespace-pre-line text-red-200 leading-relaxed">
                        {error}
                      </div>
                      {error.includes('quota') && (
                        <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700/30 rounded text-blue-200 text-xs">
                          <strong>💡 What you can do:</strong>
                          <ul className="mt-1 ml-4 space-y-1 list-disc">
                            <li>Use progress tracking and grocery lists</li>
                            <li>Try again tomorrow (resets midnight PT)</li>
                            <li>Consider upgrading to paid tier</li>
                          </ul>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setError("")} 
                      className="text-red-300 hover:text-red-100 ml-3 mt-1 flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
              
              {/* Generate button */}
                <motion.button
                  onClick={generateDietPlan}
                  disabled={loading || !formData.age || !formData.weight || !formData.height}
                  className="md:col-span-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 py-3 rounded-lg text-white font-bold mt-4 flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    <span className="flex flex-col items-center">
                      <span>Generating...</span>
                      {generationStatus && (
                        <span className="text-xs text-green-200 mt-1 animate-pulse">
                          {generationStatus}
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Generate AI Diet Plan
                  </>
                )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeSection === "results" && dietPlan && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="results-container"
              ref={dietPlanRef}
            >
              {/* Daily Progress Bar */}
              <motion.div 
                className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-700/30 rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-purple-300">Today's Progress</h4>
                  <span className="text-purple-200 text-sm">{Math.round(dailyProgress)}% Complete</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                {dailyProgress === 100 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 text-green-400 text-sm flex items-center gap-1"
                  >
                    🎉 Great job! You've completed all your meals today!
                  </motion.div>
                )}
              </motion.div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                <motion.button
                  onClick={savePlan}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bookmark size={16} />
                  Save Plan
                </motion.button>
                
                <motion.button
                  onClick={() => setShowGroceryList(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShoppingCart size={16} />
                  Grocery List
                </motion.button>
                
                <motion.button
                  onClick={() => setShowAnalytics(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TrendingUp size={16} />
                  Analytics
                </motion.button>
                
                <motion.button
                  onClick={() => setShowRecipes(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChefHat size={16} />
                  Recipes
                </motion.button>
                
                <motion.button
                  onClick={sharePlan}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 size={16} />
                  Share
                </motion.button>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Calories", value: `${dietPlan.calories} kcal`, icon: Flame, color: "from-orange-500 to-red-500" },
                  { label: "Protein", value: `${dietPlan.macros.protein}g`, icon: Target, color: "from-blue-500 to-indigo-500" },
                  { label: "Carbs", value: `${dietPlan.macros.carbs}g`, icon: Coffee, color: "from-yellow-500 to-amber-500" },
                  { label: "Fats", value: `${dietPlan.macros.fats}g`, icon: Droplet, color: "from-green-500 to-emerald-500" },
                ].map((item, index) => (
                  <motion.div 
                    key={item.label}
                    className={`macro-card p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-white text-xs font-medium">{item.label}</p>
                      <item.icon size={18} className="text-white opacity-80" />
                    </div>
                    <p className="text-white text-xl font-bold mt-1">{item.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Hydration */}
              <motion.div 
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/30 rounded-xl mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Droplet size={24} className="text-blue-400" />
                <div>
                  <h4 className="font-medium text-blue-300">Hydration</h4>
                  <p className="text-white">{dietPlan.hydration}</p>
                </div>
              </motion.div>

              {/* Tabs for different sections */}
              <div className="mb-6">
                <div className="flex border-b border-gray-700 mb-4">
                  {[
                    { id: "meals", label: "Daily Meals" },
                    { id: "weekly", label: "Weekly Plan" },
                    { id: "exercise", label: "Exercise" },
                    { id: "analysis", label: "Analysis" },
                  ].map((tab, index) => (
                    <button
                      key={tab.id}
                      onClick={() => setExpandedMeal(tab.id)}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${expandedMeal === tab.id ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                
                <AnimatePresence mode="wait">
                  {/* Daily Meals Section */}
                  {expandedMeal === "meals" && (
                    <motion.div
                      key="meals"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {Object.entries(dietPlan.meals).map(([mealName, items], index) => {
                        const mealItems = mealProgress[mealName] || [];
                        const completedItems = mealItems.filter(Boolean).length;
                        const totalItems = items.length;
                        const mealProgressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
                        
                        return (
                          <motion.div 
                            key={mealName} 
                            className="meal-section mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-green-500/30 transition-all"
                            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-bold text-green-400 flex items-center gap-2">
                                <Clock size={18} /> 
                                {mealName}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {completedItems}/{totalItems}
                                </span>
                                <div className="w-12 bg-gray-700 rounded-full h-1.5">
                                  <div 
                                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                                    style={{ width: `${mealProgressPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <ul className="space-y-2">
                              {items.map((item, idx) => {
                                const isCompleted = mealItems[idx] || false;
                                return (
                                  <li key={idx} className="flex items-center gap-3 group">
                                    <motion.button
                                      onClick={() => toggleMealItem(mealName, idx)}
                                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                        isCompleted 
                                          ? 'bg-green-500 border-green-500 text-white' 
                                          : 'border-gray-500 hover:border-green-400'
                                      }`}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      {isCompleted && (
                                        <motion.svg 
                                          className="w-3 h-3" 
                                          viewBox="0 0 20 20" 
                                          fill="currentColor"
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ type: "spring", stiffness: 500 }}
                                        >
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </motion.svg>
                                      )}
                                    </motion.button>
                                    <span className={`transition-all ${
                                      isCompleted 
                                        ? 'text-gray-400 line-through' 
                                        : 'text-gray-200 group-hover:text-white'
                                    }`}>
                                      {item}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                            {mealProgressPercentage === 100 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-2 bg-green-900/20 border border-green-700/30 rounded-md text-green-400 text-sm flex items-center gap-2"
                              >
                                <span>✅</span>
                                <span>{mealName} completed!</span>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                  
                  {/* Weekly Plan Section */}
                  {expandedMeal === "weekly" && dietPlan.weeklyPlan && (
                    <motion.div
                      key="weekly"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {Object.entries(dietPlan.weeklyPlan).map(([day, plan], index) => (
                        <motion.div 
                          key={day} 
                          className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <h4 className="font-bold text-blue-400">{day}</h4>
                          <p className="text-gray-200">{plan}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                  
                  {/* Exercise Recommendations Section */}
                  {expandedMeal === "exercise" && dietPlan.exerciseRecommendations && (
                    <motion.div
                      key="exercise"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
                    >
                      <h4 className="font-bold text-purple-400 mb-3 flex items-center gap-2">
                        <Activity size={20} /> Exercise Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {dietPlan.exerciseRecommendations.map((rec, idx) => (
                          <motion.li 
                            key={idx} 
                            className="flex items-start gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <div className="mt-1 min-w-4 h-4 w-4 rounded-full bg-purple-500 flex-shrink-0"></div>
                            <p className="text-gray-200">{rec}</p>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                  
                  {/* Nutrition Analysis Section */}
                  {expandedMeal === "analysis" && dietPlan.nutritionAnalysis && (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <motion.div 
                        className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg border border-green-700/30"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <h4 className="font-bold text-green-400 mb-2">Strengths</h4>
                        <ul className="space-y-1">
                          {dietPlan.nutritionAnalysis.strengths.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className="mt-1 min-w-4 h-4 w-4 rounded-full bg-green-500 flex-shrink-0"></div>
                              <p className="text-gray-200">{item}</p>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                      
                      <motion.div 
                        className="p-4 bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-lg border border-amber-700/30"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h4 className="font-bold text-amber-400 mb-2">Considerations</h4>
                        <ul className="space-y-1">
                          {dietPlan.nutritionAnalysis.considerations.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className="mt-1 min-w-4 h-4 w-4 rounded-full bg-amber-500 flex-shrink-0"></div>
                              <p className="text-gray-200">{item}</p>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tips */}
              <motion.div 
                className="mt-6 p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="font-bold mb-3 text-yellow-400 flex items-center gap-2">
                  <Zap size={18} /> Nutrition Tips
                </h4>
                <ul className="space-y-2">
                  {dietPlan.tips.map((tip, idx) => (
                    <motion.li 
                      key={idx} 
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                    >
                      <div className="mt-1 min-w-4 h-4 w-4 rounded-full bg-yellow-500 flex-shrink-0"></div>
                      <p className="text-gray-200">{tip}</p>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          )}
          
          {activeSection === "saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold text-green-400 mb-4">Your Saved Plans</h3>
              
              {savedPlans.length === 0 ? (
                <motion.div 
                  className="text-center py-10 text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Bookmark size={40} className="mx-auto mb-4 opacity-30" />
                  <p>You don't have any saved plans yet.</p>
                  <p className="mt-2">Create a plan and save it to see it here!</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {savedPlans.map((plan, index) => (
                    <motion.div 
                      key={plan.id} 
                      className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-green-500 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white">{plan.name}</h4>
                          <p className="text-gray-400 text-sm">{plan.date}</p>
                          <div className="flex gap-2 mt-2 text-xs">
                            <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">
                              {plan.formData.goal}
                            </span>
                            <span className="px-2 py-0.5 bg-green-900/50 text-green-300 rounded-full">
                              {plan.formData.dietaryPreference}
                            </span>
                            <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded-full">
                              {plan.plan.calories} kcal
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => loadSavedPlan(plan)}
                            className="p-1.5 bg-green-600 hover:bg-green-700 rounded-md text-white"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Activity size={16} />
                          </motion.button>
                          <motion.button
                            onClick={() => deleteSavedPlan(plan.id)}
                            className="p-1.5 bg-red-600 hover:bg-red-700 rounded-md text-white"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <RefreshCw size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Grocery List Generator */}
      <AnimatePresence>
        {showGroceryList && (
          <GroceryListGenerator
            dietPlan={dietPlan}
            isVisible={showGroceryList}
            onClose={() => setShowGroceryList(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Nutrition Analytics */}
      <AnimatePresence>
        {showAnalytics && (
          <NutritionAnalytics
            dietPlan={dietPlan}
            mealProgress={mealProgress}
            isVisible={showAnalytics}
            onClose={() => setShowAnalytics(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Smart Recipe Suggestions */}
      <AnimatePresence>
        {showRecipes && (
          <SmartRecipeSuggestions
            dietPlan={dietPlan}
            formData={formData}
            isVisible={showRecipes}
            onClose={() => setShowRecipes(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
