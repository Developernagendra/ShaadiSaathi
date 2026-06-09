const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env"), override: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const http = require("http");
const mongoose = require("mongoose");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const socketUtil = require('./utils/socket');
const { initSocketHandlers } = require('./utils/socketHandlers');
const { cloudinary } = require('./config/cloudinary');
const { errorHandler } = require('./middleware/errorMiddleware');

// Activate keep-alive mechanism
require("./keepAlive");

// Initialize Campaign Scheduler
const initCampaignScheduler = require('./utils/campaignScheduler');
initCampaignScheduler();
const app = express();
const server = http.createServer(app);

// ---------------- SOCKET.IO ----------------
const io = socketUtil.init(server);
app.set('io', io);
initSocketHandlers(io);

// ---------------- PROMISE ERROR HANDLING ----------------
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION 💥 (Process exiting for stability...)', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION 💥 (Process exiting for stability...)', err);
  process.exit(1);
});

/* ---------------- CORS & DIAGNOSTIC REQUEST LOGGING (PLACED AT TOP OF MIDDLEWARE STACK) ---------------- */
const allowedOrigins = [
  "https://shaadi-saathi.vercel.app",
  // Development origins — safe to include since production mode is gated by NODE_ENV checks
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
];

if (process.env.CLIENT_URL) {
  const strippedUrl = process.env.CLIENT_URL.replace(/\/$/, '');
  if (!allowedOrigins.includes(strippedUrl)) {
    allowedOrigins.push(strippedUrl);
  }
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin matches local, CLIENT_URL, or any Vercel domain
    const isAllowed = allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      /https:\/\/shaadi-saathi(-[a-z0-9-]+)?\.vercel\.app/.test(origin) ||
      /https:\/\/shaadisaathi(-[a-z0-9-]+)?\.vercel\.app/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS BLOCKED for Origin: ${origin}`);
      callback(new Error(`Not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  maxAge: 86400 // Cache preflight requests for 24 hours to reduce server round-trips
};

// Enable CORS with dynamic settings
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Request logging middleware to trace connectivity in production
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📡 [API RESPONSE] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms) | Origin: ${req.headers.origin || 'N/A'}`);
  });
  next();
});

/* ---------------- SECURITY ---------------- */
app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(compression());
app.use(morgan("dev"));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());

/* ---------------- RESPONSE STANDARDIZER MIDDLEWARE ---------------- */
// Adds a top-level `success` field without mutating existing keys.
// This preserves backward compatibility for all existing frontend consumers.
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const isSuccess = res.statusCode < 400 && body.success !== false && body.status !== 'fail' && body.status !== 'error';
      // Only inject `success` if not already set — avoids double-nesting
      if (!('success' in body)) {
        body.success = isSuccess;
      }
    }
    return originalJson.call(this, body);
  };
  next();
});

/* ---------------- RATE LIMIT ---------------- */
// General API rate limit — generous but protects against floods
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 5000 : 300, // Higher limit in development
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use(limiter);

// Strict auth rate limit — prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit in development
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  skip: (req) => req.path === '/test-email' || req.path === '/resend-verification' || process.env.NODE_ENV === 'development' // allow resend and skip in dev
});

/* ---------------- HEALTH ROUTES ---------------- */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShaadiSaathi API Running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server Healthy"
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Healthy"
  });
});

/* ---------------- ROUTES ---------------- */
const { testEmail } = require("./controllers/authController");
app.get("/api/test-email", testEmail);

app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/vendor", require("./routes/vendorRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/cab-booking", require("./routes/cabRoutes"));
app.use("/api/baraat-cabs", require("./routes/cabRoutes"));
app.use("/api/fleet", require("./routes/fleetRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/features", require("./routes/featureRoutes"));
app.use("/api/availability", require("./routes/availabilityRoutes"));
app.use("/api/offers", require("./routes/offerRoutes"));
app.use("/api/newsletter", require("./routes/newsletterRoutes"));

/* ---------------- 404 ---------------- */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found"
  });
});

/* ---------------- ERROR HANDLER ---------------- */
app.use(errorHandler);

/* ---------------- DATABASE & SEEDERS ---------------- */
const repairCategories = async () => {
  try {
    const { Category, Service } = require('./models/index');
    const Vendor = require('./models/Vendor');

    console.log('🔄 STARTING HEURISTIC CATEGORY REPAIR & SELF-HEALING SYSTEM...');

    // 1. Ensure categories are seeded (same default categories as categoryController)
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('⏳ Seeding default categories during startup repair...');
      const defaultCategories = [
        { name: 'Photography', icon: '📷', slug: 'photography', order: 1, isActive: true },
        { name: 'Catering', icon: '🍽️', slug: 'catering', order: 2, isActive: true },
        { name: 'Decoration', icon: '✨', slug: 'decoration', order: 3, isActive: true },
        { name: 'Mehndi', icon: '🌿', slug: 'mehndi', order: 4, isActive: true },
        { name: 'Venue', icon: '🏛️', slug: 'venue', order: 5, isActive: true },
        { name: 'DJ', icon: '🎵', slug: 'dj', order: 6, isActive: true },
        { name: 'Makeup Artist', icon: '💄', slug: 'makeup-artist', order: 7, isActive: true },
        { name: 'Tent House', icon: '🎪', slug: 'tent-house', order: 8, isActive: true },
        { name: 'Pandit', icon: '🪔', slug: 'pandit', order: 9, isActive: true },
        { name: 'Cab Service', icon: '🚗', slug: 'cab-service', order: 10, isActive: true }
      ];
      await Category.create(defaultCategories);
      console.log('✅ Default categories seeded successfully.');
    }

    // Load all categories for matching
    const allCategories = await Category.find();
    const catMap = {}; // slug -> ObjectId
    allCategories.forEach(c => {
      catMap[c.slug] = c._id;
    });

    const matchCategorySlug = (text) => {
      if (!text) return 'photography';
      const t = text.toLowerCase();
      if (t.includes('photo') || t.includes('cam') || t.includes('shoot')) return 'photography';
      if (t.includes('purohit') || t.includes('pandit') || t.includes('priest') || t.includes('pujari')) return 'pandit';
      if (t.includes('mehndi') || t.includes('henna') || t.includes('mehendi')) return 'mehndi';
      if (t.includes('cater') || t.includes('food') || t.includes('kitchen') || t.includes('cook')) return 'catering';
      if (t.includes('decor') || t.includes('flower') || t.includes('light') || t.includes('theme')) return 'decoration';
      if (t.includes('hall') || t.includes('venue') || t.includes('resort') || t.includes('lawn') || t.includes('banquet')) return 'venue';
      if (t.includes('dj') || t.includes('music') || t.includes('sound') || t.includes('band') || t.includes('singer')) return 'dj';
      if (t.includes('makeup') || t.includes('parlor') || t.includes('beauty') || t.includes('salon') || t.includes('bridal')) return 'makeup-artist';
      if (t.includes('tent') || t.includes('pandal')) return 'tent-house';
      if (t.includes('cab') || t.includes('car') || t.includes('travel') || t.includes('vehicle') || t.includes('operator')) return 'cab-service';
      return 'photography'; // fallback
    };

    // 2. Repair Services missing category
    const servicesToRepair = await Service.find({
      $or: [
        { category: null },
        { category: { $exists: false } }
      ]
    });

    if (servicesToRepair.length > 0) {
      console.log(`⏳ Found ${servicesToRepair.length} Services with missing/null category. Repairing...`);
      for (const service of servicesToRepair) {
        const textToMatch = `${service.title} ${service.description || ''}`;
        const matchedSlug = matchCategorySlug(textToMatch);
        const catId = catMap[matchedSlug] || allCategories[0]._id;
        service.category = catId;
        await service.save({ validateBeforeSave: false });
        console.log(`✅ Repaired category for Service: "${service.title}" -> Assigned: "${matchedSlug}"`);
      }
    }

    // 3. Repair Vendors missing category
    const vendorsToRepair = await Vendor.find({
      $or: [
        { category: null },
        { category: { $exists: false } }
      ]
    });

    if (vendorsToRepair.length > 0) {
      console.log(`⏳ Found ${vendorsToRepair.length} Vendor profiles with missing/null category. Repairing...`);
      for (const vendor of vendorsToRepair) {
        // Attempt to find any service by this vendor and copy its category
        const vendorService = await Service.findOne({ vendor: vendor._id, category: { $ne: null } });
        if (vendorService) {
          vendor.category = vendorService.category;
          await vendor.save({ validateBeforeSave: false });
          console.log(`✅ Repaired category for Vendor: "${vendor.businessName}" -> Copied from Service: "${vendorService.title}"`);
        } else {
          // Check businessName or description
          const textToMatch = `${vendor.businessName || ''} ${vendor.description || ''} ${vendor.tagline || ''}`;
          const matchedSlug = matchCategorySlug(textToMatch);
          const catId = catMap[matchedSlug] || allCategories[0]._id;
          vendor.category = catId;
          await vendor.save({ validateBeforeSave: false });
          console.log(`✅ Repaired category for Vendor: "${vendor.businessName}" -> Assigned slug: "${matchedSlug}"`);
        }
      }
    }

    console.log('✅ HEURISTIC CATEGORY REPAIR & SELF-HEALING SYSTEM COMPLETED.');

  } catch (err) {
    console.error('❌ Error during Category Repair & Migration:', err);
  }
};

const startServer = async () => {
  try {
    if (cloudinary) {
      console.log('✅ Cloudinary configured');
    }

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("Mongo URI missing");
    }

    // Security guard to prevent localhost MongoDB connections in a production environment
    if (process.env.NODE_ENV === 'production' && (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1'))) {
      console.error('❌ CRITICAL CONFIGURATION ERROR: Attempted to connect to localhost MongoDB in a production environment! Server boot terminated.');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 50,
      retryWrites: true,
      retryReads: true
    });
    console.log("✅ MongoDB connected");

    // Run self-healing category repair migration
    await repairCategories();

    // Auto-seed/Ensure default admin exists with correct credentials
    try {
      const User = require('./models/User');
      const adminEmail = 'admin@shaadisaathi.com';
      let admin = await User.findOne({ email: adminEmail }).select('+password');

      if (!admin) {
        const adminPass = process.env.ADMIN_PASS || 'Admin@123';
        console.log('⏳ Default admin not found. Seeding admin user...');
        await User.create({
          name: 'System Admin',
          email: adminEmail,
          password: adminPass,
          role: 'admin',
          isVerified: true,
          isEmailVerified: true,
          isActive: true
        });
        console.log(`✅ Default admin seeded successfully. Use ADMIN_PASS env var to set password.`);
      } else {
        let needsUpdate = false;
        if (admin.role !== 'admin') {
          admin.role = 'admin';
          needsUpdate = true;
        }
        if (!admin.isActive) {
          admin.isActive = true;
          needsUpdate = true;
        }
        const adminPass = process.env.ADMIN_PASS || 'Admin@123';
        const isPasswordCorrect = await admin.comparePassword(adminPass);
        if (!isPasswordCorrect && process.env.ADMIN_PASS) {
          // Only auto-update password if ADMIN_PASS env var is explicitly set
          admin.password = adminPass;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await admin.save();
          console.log('✅ Default admin credentials verified and updated.');
        }
      }
    } catch (dbErr) {
      console.error('⚠️ Error verifying or seeding default admin:', dbErr.message);
    }

    // Auto-normalize and validate existing Cab documents to ensure dropdowns work
    try {
      const { Cab } = require('./models/index');
      const cabsToNormalize = await Cab.find({
        $or: [
          { vehicleName: { $exists: false } },
          { isApproved: { $exists: false } },
          { isActive: { $exists: false } },
          { vendorId: { $exists: false } },
          { category: { $exists: false } },
          { status: 'pending' }
        ]
      });

      if (cabsToNormalize.length > 0) {
        console.log(`⏳ Normalizing ${cabsToNormalize.length} fleet vehicles in the database...`);
        for (const cab of cabsToNormalize) {
          try {
            if (cab.status === 'pending') {
              cab.status = 'approved';
              cab.isAvailable = true;
            }
            await cab.save({ validateBeforeSave: false });
          } catch (e) {
            console.error(`⚠️ Failed to normalize cab ${cab._id}:`, e.message);
          }
        }
        console.log('✅ Fleet database normalization completed successfully.');
      }
    } catch (normErr) {
      console.error('⚠️ Error during startup fleet normalization:', normErr.message);
    }

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup Error:", error);
    process.exit(1);
  }
};

startServer();

/* ---------------- SHUTDOWN ---------------- */
process.on("SIGINT", async () => {
  console.log("👋 Server shutting down");
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = { app, server, io };