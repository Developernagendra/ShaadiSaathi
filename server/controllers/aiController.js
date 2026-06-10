const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const OpenAI = require('openai');
const { Category, Vendor } = require('../models');

// Initialize OpenAI SDK
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Global Circuit Breaker State
const providerHealth = {
  provider: 'openai',
  status: 'up', // 'up' or 'down'
  reason: null,
  retryAfter: null // Timestamp when we can try again
};

exports.generateWeddingPlan = catchAsync(async (req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) console.time("AI_REQUEST_TOTAL");
  const { brideName, groomName, weddingDate, city, budget, guestCount, weddingType, servicesRequired, resetCircuit } = req.body;

  // Manual reset of the circuit breaker from the frontend
  if (resetCircuit) {
    providerHealth.status = 'up';
    providerHealth.reason = null;
    providerHealth.retryAfter = null;
  }

  if (!city || !budget || !guestCount) {
    return next(new AppError('Please provide city, budget and guest count', 400));
  }

  const prompt = `
    You are an expert Indian wedding planner named "ShaadiSaathi AI".
    Create a highly detailed, personalized wedding plan for a couple with these details:
    - Bride: ${brideName || 'Bride'}
    - Groom: ${groomName || 'Groom'}
    - Wedding Date: ${weddingDate || 'Not decided'}
    - City: ${city}
    - Total Budget: ₹${budget}
    - Guest Count: ${guestCount}
    - Wedding Type/Vibe: ${weddingType || 'Traditional'}
    - Key Services Required: ${servicesRequired ? servicesRequired.join(', ') : 'All standard services'}

    You MUST output valid, structured JSON exactly matching the following schema.
    Do NOT include Markdown formatting like \`\`\`json. Return raw JSON only.

    {
      "summary": "Short inspiring summary of the wedding plan",
      "budgetBreakdown": [
        { "category": "Venue", "amount": 100000, "percentage": 20, "notes": "example" }
      ],
      "timeline": [
        { "timeframe": "6-12 Months Before", "tasks": ["Book Venue", "Hire Planner"] }
      ],
      "checklist": [
        { "phase": "Pre-Wedding", "items": ["Finalize Guest List"] }
      ],
      "recommendations": [
        { "service": "Photography", "ideas": ["Candid styles", "Drone shoot"] }
      ],
      "tips": ["Book vendors early"]
    }
  `;

  const generateLocalFallbackPlan = (details) => {
    const { brideName, groomName, budget, guestCount, city, weddingType } = details;
    const b = Number(budget) || 500000;
    return {
      summary: `A beautiful ${weddingType || 'Traditional'} wedding in ${city} for ${brideName || 'the bride'} and ${groomName || 'the groom'} hosting ${guestCount} guests, crafted with ShaadiSaathi AI.`,
      budgetBreakdown: [
        { category: "Venue & Catering", amount: Math.floor(b * 0.45), percentage: 45, notes: "Major portion of budget for guest comfort" },
        { category: "Photography", amount: Math.floor(b * 0.15), percentage: 15, notes: "Capturing memories" },
        { category: "Decoration", amount: Math.floor(b * 0.15), percentage: 15, notes: "Floral and lighting" },
        { category: "Attire & Makeup", amount: Math.floor(b * 0.15), percentage: 15, notes: "Bridal and groom wear" },
        { category: "Miscellaneous", amount: Math.floor(b * 0.10), percentage: 10, notes: "Contingency fund" }
      ],
      timeline: [
        { timeframe: "6-12 Months Before", tasks: ["Set date and budget", "Book primary venue", "Hire planner"] },
        { timeframe: "3-6 Months Before", tasks: ["Book photographer & decorator", "Finalize guest list"] },
        { timeframe: "1-3 Months Before", tasks: ["Send invitations", "Book makeup artist & pandit"] },
        { timeframe: "1 Week Before", tasks: ["Finalize catering headcount", "Reconfirm all vendors"] }
      ],
      checklist: [
        { phase: "Pre-Wedding", items: ["Venue booked", "Photographer hired", "Outfits purchased"] },
        { phase: "Wedding Day", items: ["Rings ready", "Vendor payments prepared", "Emergency kit packed"] }
      ],
      recommendations: [
        { service: "Photography", ideas: ["Candid moments", "Drone coverage", "Pre-wedding shoot"] },
        { service: "Decoration", ideas: ["Pastel floral themes", "Fairy lights canopy"] },
        { service: "Catering", ideas: ["Live counters", "Local delicacies", "Signature cocktails"] }
      ],
      tips: [
        "Book your venue at least 6 months in advance.",
        "Keep a 10% buffer in your budget for unexpected costs.",
        "Delegate tasks to reliable friends and family."
      ]
    };
  };

  let aiData = null;
  let isFallback = false;

  if (isDev) console.time("PROVIDER_SELECTION");
  // Check Circuit Breaker
  if (providerHealth.status === 'down') {
    if (Date.now() < providerHealth.retryAfter) {
      console.warn(`⚡ Circuit Breaker OPEN: Skipping OpenAI request. Reason: ${providerHealth.reason}`);
    } else {
      console.log("⚡ Circuit Breaker HALF-OPEN: Attempting OpenAI connection again.");
      providerHealth.status = 'up'; // Reset and try again
    }
  }
  if (isDev) console.timeEnd("PROVIDER_SELECTION");

  // OpenAI Integration with Smart Error Detection
  if (openai && providerHealth.status === 'up') {
    let retries = 2; // Reduced retries to fail faster
    let delay = 1000;

    if (isDev) console.time("OPENAI_EXECUTION");
    while (retries > 0 && !aiData) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Strict 5s timeout

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a specialized JSON-output AI. You only return valid, strictly typed JSON objects. You NEVER output markdown formatting."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        }, { signal: controller.signal });

        clearTimeout(timeoutId);

        const aiResponseRaw = completion.choices[0].message.content;
        aiData = JSON.parse(aiResponseRaw);
      } catch (error) {
        // Smart Error Detection
        const status = error.status;
        const errType = error.error?.type || error.type;
        
        if (status === 429 || status === 401 || errType === 'insufficient_quota' || errType === 'invalid_api_key') {
          console.error(`❌ OpenAI Critical Error (${status} - ${errType}): Disabling provider for 30 minutes.`);
          providerHealth.status = 'down';
          providerHealth.reason = errType || 'quota_or_auth_error';
          providerHealth.retryAfter = Date.now() + (5 * 60 * 1000); // 5 mins cooldown (fast recovery)
          aiData = null;
          break; // Break the retry loop immediately
        }

        console.warn(`⚠️ OpenAI attempt failed. Retries left: ${retries - 1}. Error:`, error.message);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Mild exponential backoff
        } else {
          console.error("❌ OpenAI completely failed after retries. Falling back to local templates.");
        }
      }
    }
    if (isDev) console.timeEnd("OPENAI_EXECUTION");
  }

  // Fallback if OpenAI fails completely or is not configured
  if (!aiData) {
    if (isDev) console.time("FALLBACK_GENERATION");
    aiData = generateLocalFallbackPlan(req.body);
    isFallback = true;
    if (isDev) console.timeEnd("FALLBACK_GENERATION");
  }

  if (isDev) console.time("DATABASE_VENDORS_FETCH");
  let localVendors = [];
  try {
    // Only fetch database vendors if NOT falling back to guarantee < 500ms speed during failures
    if (!isFallback) {
      const categories = await Category.find({ isActive: true });
      
      const vendorPromises = categories.map(async (cat) => {
        if (servicesRequired && servicesRequired.length > 0 && !servicesRequired.includes(cat.name)) {
          return null; // Skip if user specifically didn't ask for this service
        }

        const vendors = await Vendor.find({
          'location.city': { $regex: new RegExp(city, 'i') },
          category: cat._id,
          approvalStatus: process.env.NODE_ENV === 'development' ? { $in: ['approved', 'pending'] } : 'approved'
        })
        .sort({ 'rating.average': -1 })
        .limit(3)
        .select('businessName basePrice rating reviews coverImage city category');

        if (vendors.length > 0) {
          return {
            categoryName: cat.name,
            vendors
          };
        }
        return null;
      });

      const resolvedVendors = await Promise.all(vendorPromises);
      localVendors = resolvedVendors.filter(v => v !== null);
    }
  } catch (dbError) {
    console.error("❌ Database Error while fetching local vendors:", dbError);
  }
  if (isDev) console.timeEnd("DATABASE_VENDORS_FETCH");

  if (isDev) console.time("RESPONSE_SERIALIZATION");
  const responseData = {
    status: 'success',
    fallback: isFallback,
    data: {
      aiPlan: aiData,
      localVendors,
      meta: { brideName, groomName, weddingDate, city, budget, guestCount },
      fallback: isFallback
    }
  };
  
  res.status(200).json(responseData);
  if (isDev) console.timeEnd("RESPONSE_SERIALIZATION");
  if (isDev) console.timeEnd("AI_REQUEST_TOTAL");
});

exports.getHealth = catchAsync(async (req, res, next) => {
  let status = 'healthy';
  
  if (!openai || providerHealth.status === 'down') {
    status = 'degraded';
  }

  res.status(200).json({
    status: status,
    provider: providerHealth.provider,
    providerStatus: providerHealth.status,
    reason: providerHealth.reason,
    cooldownRemainingMs: providerHealth.retryAfter ? Math.max(0, providerHealth.retryAfter - Date.now()) : 0,
    message: status === 'healthy' ? 'AI Provider is active' : 'AI Provider is unavailable. Using Local Templates.'
  });
});
