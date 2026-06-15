const mongoose = require('mongoose');

// ==================== WEDDING PLAN MODEL (AI Planner) ====================
const weddingPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weddingDate: { type: Date },
  location: { type: String },
  budget: { type: Number },
  guestCount: { type: Number },
  weddingType: { type: String },
  roadmap: { type: mongoose.Schema.Types.Mixed }, // JSON output from AI
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });

weddingPlanSchema.index({ user: 1, createdAt: -1 });
const WeddingPlan = mongoose.model('WeddingPlan', weddingPlanSchema);

// ==================== BUDGET PLAN MODEL (Budget Calculator) ====================
const budgetPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalBudget: { type: Number, required: true },
  allocations: { type: Map, of: Number }, // category -> amount
  customCategories: [{ name: String, amount: Number }],
}, { timestamps: true });

budgetPlanSchema.index({ user: 1 });
const BudgetPlan = mongoose.model('BudgetPlan', budgetPlanSchema);

// ==================== COST PREDICTION MODEL ====================
const costPredictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  city: { type: String },
  guestCount: { type: Number },
  weddingType: { type: String },
  services: [String],
  totalEstimatedCost: { type: Number },
  rangeLow: { type: Number },
  rangeHigh: { type: Number },
  breakdown: { type: Map, of: Number },
}, { timestamps: true });

costPredictionSchema.index({ user: 1 });
const CostPrediction = mongoose.model('CostPrediction', costPredictionSchema);

// ==================== BARAAT BOOKING REQUEST MODEL ====================
const baraatBookingRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  guestCount: { type: Number, required: true },
  distance: { type: Number, default: 0 },
  breakdown: {
    buses: { type: Number, default: 0 },
    sedans: { type: Number, default: 0 },
    suvs: { type: Number, default: 0 },
  },
  estimatedCost: { type: Number },
  status: { type: String, enum: ['pending', 'contacted', 'confirmed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

baraatBookingRequestSchema.index({ user: 1 });
const BaraatBookingRequest = mongoose.model('BaraatBookingRequest', baraatBookingRequestSchema);

// ==================== SAVED KUNDLI REPORT ====================
const savedKundliSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brideName: { type: String },
  groomName: { type: String },
  totalScore: { type: Number },
  percentage: { type: Number },
  reportData: { type: mongoose.Schema.Types.Mixed }, // Full JSON from astrology engine
  language: { type: String, default: 'en' }
}, { timestamps: true });

savedKundliSchema.index({ user: 1 });
const SavedKundli = mongoose.model('SavedKundli', savedKundliSchema);

// ==================== SAVED MUHURAT SEARCH ====================
const savedMuhuratSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  city: { type: String },
  state: { type: String },
  year: { type: Number },
  month: { type: Number },
  muhurats: [{ type: mongoose.Schema.Types.Mixed }], // Array of dates from astrology engine
  language: { type: String, default: 'en' }
}, { timestamps: true });

savedMuhuratSchema.index({ user: 1 });
const SavedMuhurat = mongoose.model('SavedMuhurat', savedMuhuratSchema);

module.exports = {
  WeddingPlan,
  BudgetPlan,
  CostPrediction,
  BaraatBookingRequest,
  SavedKundli,
  SavedMuhurat
};
