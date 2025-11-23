const fetch = global.fetch || require('node-fetch');

// Helper to try different endpoints/payloads
async function tryEndpoint(url, apiKey, body) {
  const res = await fetch(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { json = null; }
  return { ok: res.ok, status: res.status, text, json };
}

function extractTextFromResponse(json, rawText) {
  if (!json) return rawText || '';
  // Try common shapes
  if (json.candidates && json.candidates[0] && json.candidates[0].output) return json.candidates[0].output;
  if (json.candidates && json.candidates[0] && json.candidates[0].content) return json.candidates[0].content;
  if (json.output && Array.isArray(json.output) && json.output[0] && json.output[0].content) return json.output[0].content;
  if (json["outputText"]) return json.outputText;
  if (json.result && json.result.output && json.result.output[0] && json.result.output[0].content) return json.result.output[0].content;
  // Fallback: stringify parts
  return JSON.stringify(json);
}

exports.generate = async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const model = req.body.model || process.env.DEFAULT_GEMINI_MODEL || 'gemini-pro';
    if (!prompt) return res.status(400).json({ success: false, error: 'Missing prompt in request body' });

    // Support multiple environment variable names for ease of setup
    const API_KEY = process.env.GENERATIVE_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_GEN_API_KEY || process.env.OPENAI_API_KEY || '';

    // If API key missing, use a local fallback generator so frontend receives a usable plan
    if (!API_KEY) {
      try {
        console.warn('GENERATIVE API key not configured - returning local fallback plan');

        // Lightweight parser to extract calories, diet preference, goal and weight from the prompt
        const extractValue = (regex, fallback) => {
          const m = prompt.match(regex);
          return m ? m[1].trim() : fallback;
        };

        const caloriesRaw = extractValue(/TDEE:\s*(\d+)/i, null) || extractValue(/calories?:\s*(\d+)/i, null);
        const calories = caloriesRaw ? parseInt(caloriesRaw, 10) : 2000;
        const diet = extractValue(/Diet:\s*([a-zA-Z\- ]+)/i, 'omnivore').toLowerCase();
        const goal = extractValue(/Goal:\s*([a-zA-Z\- ]+)/i, 'maintain').toLowerCase();
        const weightRaw = extractValue(/Weight:\s*(\d+)/i, null);
        const weight = weightRaw ? parseFloat(weightRaw) : 70;

        // Local generator (kept small and deterministic)
        const generateLocal = (cal, frmDiet, frmGoal, wt) => {
          let proteinPct = 0.25, carbsPct = 0.45, fatsPct = 0.30;
          if (frmGoal && frmGoal.includes('lose')) { proteinPct = 0.30; carbsPct = 0.35; fatsPct = 0.35; }
          if (frmGoal && frmGoal.includes('gain')) { proteinPct = 0.25; carbsPct = 0.50; fatsPct = 0.25; }

          const proteinG = Math.round((cal * proteinPct) / 4);
          const carbsG = Math.round((cal * carbsPct) / 4);
          const fatsG = Math.round((cal * fatsPct) / 9);
          const hydrationLiters = Math.max(1.5, Math.round((wt * 35) / 1000 * 10) / 10);

          const proteinSources = {
            omnivore: ['Eggs', 'Greek yogurt', 'Grilled chicken', 'Salmon', 'Tuna'],
            vegetarian: ['Greek yogurt', 'Cottage cheese', 'Eggs', 'Lentils', 'Chickpeas'],
            vegan: ['Tofu', 'Tempeh', 'Lentils', 'Chickpeas', 'Peanut butter']
          };

          const sources = proteinSources[frmDiet] || proteinSources['omnivore'];

          const meals = {
            Breakfast: [`${sources[0]} (protein)`, 'Whole grain (oats/toast)', 'Fruit (banana/berries)'],
            Lunch: [`${sources[1] || sources[2]} (protein)`, 'Complex carbs (brown rice/quinoa)', 'Mixed vegetables'],
            Dinner: [`${sources[2] || sources[3]} (protein)`, 'Starchy veg or small grains', 'Leafy salad / steamed veg'],
            Snack: ['Nuts or seeds', 'Yogurt/hummus with veg', 'Piece of fruit']
          };

          const weeklyPlan = {
            Monday: 'Balanced meals with emphasis on protein',
            Tuesday: 'Extra vegetables and hydration',
            Wednesday: 'Moderate carbs, higher protein',
            Thursday: 'Include healthy fats and whole grains',
            Friday: 'Higher carbs if active',
            Saturday: 'Meal prep and varied proteins',
            Sunday: 'Lighter meals and recovery'
          };

          const exerciseRecommendations = ['30-45 minutes moderate cardio 3x/week', '2x strength sessions/week', '1 rest or mobility day'];

          const nutritionAnalysis = {
            strengths: ['Reasonable calorie target', 'Good protein emphasis', 'Hydration guidance included'],
            considerations: ['Adjust portion sizes', 'Time carbs around workouts', 'Watch added sugars']
          };

          const tips = ['Prioritize protein at each meal', 'Prepare meals in advance', 'Drink water regularly', 'Include colorful vegetables', 'Track progress and adjust'];

          return {
            calories: cal,
            macros: { protein: proteinG, carbs: carbsG, fats: fatsG },
            hydration: `${hydrationLiters} L per day (approx.)`,
            meals,
            weeklyPlan,
            exerciseRecommendations,
            nutritionAnalysis,
            tips
          };
        };

        const plan = generateLocal(calories, diet, goal, weight);
        return res.json({ success: true, raw: plan, text: JSON.stringify(plan), fallback: true });
      } catch (fallbackErr) {
        console.error('Local fallback generation failed:', fallbackErr);
        return res.status(500).json({ success: false, error: 'Local fallback generation failed', details: fallbackErr && fallbackErr.message ? fallbackErr.message : fallbackErr });
      }
    }

    const base = 'https://generativelanguage.googleapis.com';

    // Candidate endpoints and payload shapes (try in order)
    const attempts = [
      { url: `${base}/v1beta/models/${model}:generateText`, body: { prompt: { text: prompt } } },
      { url: `${base}/v1beta/models/${model}:generateContent`, body: { prompt: { text: prompt } } },
      { url: `${base}/v1beta/models/${model}:generateContent`, body: { input: prompt } },
      { url: `${base}/v1/models/${model}:generateText`, body: { prompt: { text: prompt } } },
    ];

    let lastErr = null;
    for (const attempt of attempts) {
      try {
        const r = await tryEndpoint(attempt.url, API_KEY, attempt.body);
        if (r.ok) {
          const text = extractTextFromResponse(r.json, r.text);
          return res.json({ success: true, raw: r.json || r.text, text });
        }
        lastErr = { status: r.status, text: r.text, json: r.json };
        // If 404 or model not found, continue to next attempt
      } catch (e) {
        lastErr = e;
      }
    }

    return res.status(502).json({ success: false, error: 'All generation attempts failed', details: lastErr });
  } catch (err) {
    console.error('AI generate error:', err);
    res.status(500).json({ success: false, error: 'Server error while generating AI content', details: err && err.message ? err.message : err });
  }
};
