import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ─── Templates Data (Static for now, later from API) ────────────────────
const TEMPLATE_DATA = [
  { id: 't1', name: 'Royal Rajputana', category: 'Hindu Wedding', isPremium: false, isPopular: true, img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', colors: { bg: '#1a0a0a', text: '#fff', accent: '#D4AF37' }, font: 'Playfair Display' },
  { id: 't2', name: 'Velvet Romance', category: 'Luxury Wedding', isPremium: false, isPopular: true, img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', colors: { bg: '#2d0a1a', text: '#fff', accent: '#C2185B' }, font: 'Cormorant Garamond' },
  { id: 't3', name: 'Garden Bliss', category: 'Floral Wedding', isPremium: false, isPopular: false, img: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80', colors: { bg: '#f5f0e8', text: '#2d2d2d', accent: '#6b8e5a' }, font: 'Lora' },
  { id: 't4', name: 'Midnight Sparkle', category: 'Modern Wedding', isPremium: false, isPopular: true, img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80', colors: { bg: '#0f0f1a', text: '#fff', accent: '#8b5cf6' }, font: 'Inter' },
  { id: 't5', name: 'Ivory Classic', category: 'Traditional Wedding', isPremium: false, isPopular: false, img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80', colors: { bg: '#faf6f0', text: '#3d2b1f', accent: '#D4AF37' }, font: 'Playfair Display' },
  { id: 't6', name: 'Nikah Elegance', category: 'Muslim Nikah', isPremium: false, isPopular: false, img: 'https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=800&q=80', colors: { bg: '#0a2540', text: '#fff', accent: '#22d3ee' }, font: 'Amiri' },
  { id: 't7', name: 'Punjab Vibes', category: 'Sikh Wedding', isPremium: true, isPopular: false, img: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800&q=80', colors: { bg: '#ff6b00', text: '#fff', accent: '#fbbf24' }, font: 'Poppins' },
  { id: 't8', name: 'Sacred Vows', category: 'Christian Wedding', isPremium: false, isPopular: false, img: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80', colors: { bg: '#fff', text: '#1a1a2e', accent: '#C2185B' }, font: 'Cormorant Garamond' },
  { id: 't9', name: 'Dravidian Splendor', category: 'South Indian Wedding', isPremium: true, isPopular: true, img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', colors: { bg: '#8B0000', text: '#fff', accent: '#D4AF37' }, font: 'Merriweather' },
  { id: 't10', name: 'Bengali Charm', category: 'Bengali Wedding', isPremium: true, isPopular: false, img: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80', colors: { bg: '#fff5f5', text: '#7c2d12', accent: '#dc2626' }, font: 'Lora' },
  { id: 't11', name: 'Minimal Luxe', category: 'Minimal Wedding', isPremium: false, isPopular: true, img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80', colors: { bg: '#fff', text: '#111', accent: '#000' }, font: 'Inter' },
  { id: 't12', name: 'Royal Heritage', category: 'Royal Wedding', isPremium: true, isPopular: true, img: 'https://images.unsplash.com/photo-1549488344-cbb6c34cf1ac?w=800&q=80', colors: { bg: '#1a0a2e', text: '#fff', accent: '#D4AF37' }, font: 'Cinzel' },
];

// ─── Default Builder State ──────────────────────────────────────────────
const defaultInvitation = {
  templateId: 't1',
  couple: { brideName: '', groomName: '', couplePhoto: null, coupleStory: '' },
  event: { weddingDate: '', weddingTime: '', venueName: '', venueAddress: '', googleMapsLink: '' },
  subEvents: [
    { name: 'Engagement', enabled: false, date: '', time: '', venue: '' },
    { name: 'Haldi', enabled: false, date: '', time: '', venue: '' },
    { name: 'Mehndi', enabled: false, date: '', time: '', venue: '' },
    { name: 'Sangeet', enabled: false, date: '', time: '', venue: '' },
    { name: 'Wedding', enabled: true, date: '', time: '', venue: '' },
    { name: 'Reception', enabled: false, date: '', time: '', venue: '' },
  ],
  rsvp: { contactPerson: '', phone: '', email: '', whatsapp: '' },
  theme: { bgColor: '#1a0a0a', textColor: '#ffffff', accentColor: '#D4AF37', fontFamily: 'Playfair Display', fontSize: 16, fontStyle: 'normal' },
  media: { photos: [], videos: [], bgMusic: null },
  advanced: { countdownEnabled: true, qrCode: true, customUrl: '', socialLinks: { instagram: '', facebook: '', twitter: '' } },
  status: 'draft',
};

// ─── Mock saved invitations for dashboard ───────────────────────────────
const mockInvitations = [
  {
    _id: 'inv1',
    couple: { brideName: 'Anjali', groomName: 'Rahul', couplePhoto: null },
    event: { weddingDate: '2026-12-15', venueName: 'ITC Maurya, New Delhi' },
    templateId: 't1',
    status: 'published',
    createdAt: '2026-06-01T10:00:00Z',
    analytics: { views: 1240, shares: 89, rsvpCount: 382 },
  },
  {
    _id: 'inv2',
    couple: { brideName: 'Priya', groomName: 'Aman', couplePhoto: null },
    event: { weddingDate: '2026-11-20', venueName: 'Taj Lake Palace, Udaipur' },
    templateId: 't12',
    status: 'draft',
    createdAt: '2026-06-05T14:00:00Z',
    analytics: { views: 0, shares: 0, rsvpCount: 0 },
  },
];

// ─── Async Thunks ───────────────────────────────────────────────────────

export const fetchInvitations = createAsyncThunk(
  'invitation/fetchInvitations',
  async (_, { rejectWithValue }) => {
    try {
      // When backend is ready: const res = await api.get('/invitations'); return res.data.data;
      return mockInvitations;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch invitations');
    }
  }
);

export const createInvitation = createAsyncThunk(
  'invitation/createInvitation',
  async (data, { rejectWithValue }) => {
    try {
      // const res = await api.post('/invitations', data); return res.data.data;
      return { _id: `inv_${Date.now()}`, ...data, createdAt: new Date().toISOString(), analytics: { views: 0, shares: 0, rsvpCount: 0 } };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to create invitation');
    }
  }
);

export const updateInvitation = createAsyncThunk(
  'invitation/updateInvitation',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // const res = await api.put(`/invitations/${id}`, data); return res.data.data;
      return { _id: id, ...data };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to update invitation');
    }
  }
);

export const deleteInvitation = createAsyncThunk(
  'invitation/deleteInvitation',
  async (id, { rejectWithValue }) => {
    try {
      // await api.delete(`/invitations/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to delete invitation');
    }
  }
);

export const generateAIContent = createAsyncThunk(
  'invitation/generateAIContent',
  async ({ type, style }, { rejectWithValue }) => {
    try {
      // Mock AI content
      const content = {
        'wedding': "Together with their families, we joyfully invite you to celebrate the union of two hearts becoming one. Join us as we begin our journey of forever.",
        'reception': "Your presence is the greatest gift. Join us for an evening of celebration, joy, and love as we mark the beginning of our new chapter together.",
        'mehndi': "Come adorn the bride with beautiful henna patterns! Join us for a colorful celebration filled with music, dance, and joy.",
        'haldi': "Join us for the auspicious Haldi ceremony as we bless the couple with turmeric and good wishes before their big day.",
        'romantic_quote': "Two souls with but a single thought, two hearts that beat as one.",
        'traditional_quote': "Where there is love there is life. — Mahatma Gandhi",
        'modern_quote': "I choose you. And I'll choose you, over and over and over. Without pause, without a doubt, in a heartbeat. I'll keep choosing you.",
        'hindi_quote': "तेरा साथ है तो मुझे क्या कमी है, तू मेरी दुआ है, तू ही मेरी ख़ुशी है।",
      };
      await new Promise(r => setTimeout(r, 1000)); // simulate delay
      return { type, content: content[type] || content['wedding'] };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to generate AI content');
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────────────

const invitationSlice = createSlice({
  name: 'invitation',
  initialState: {
    invitations: [],
    templates: TEMPLATE_DATA,
    currentInvitation: { ...defaultInvitation },
    favoriteTemplates: [],
    activeCategory: 'All',
    previewDevice: 'mobile', // mobile | tablet | desktop
    aiContent: null,
    aiLoading: false,
    loading: false,
    error: null,
  },
  reducers: {
    // Builder form updates
    updateCouple: (state, action) => {
      state.currentInvitation.couple = { ...state.currentInvitation.couple, ...action.payload };
    },
    updateEvent: (state, action) => {
      state.currentInvitation.event = { ...state.currentInvitation.event, ...action.payload };
    },
    updateSubEvent: (state, action) => {
      const { index, data } = action.payload;
      state.currentInvitation.subEvents[index] = { ...state.currentInvitation.subEvents[index], ...data };
    },
    updateRSVP: (state, action) => {
      state.currentInvitation.rsvp = { ...state.currentInvitation.rsvp, ...action.payload };
    },
    updateTheme: (state, action) => {
      state.currentInvitation.theme = { ...state.currentInvitation.theme, ...action.payload };
    },
    updateMedia: (state, action) => {
      state.currentInvitation.media = { ...state.currentInvitation.media, ...action.payload };
    },
    updateAdvanced: (state, action) => {
      state.currentInvitation.advanced = { ...state.currentInvitation.advanced, ...action.payload };
    },
    selectTemplate: (state, action) => {
      const template = state.templates.find(t => t.id === action.payload);
      if (template) {
        state.currentInvitation.templateId = template.id;
        state.currentInvitation.theme.bgColor = template.colors.bg;
        state.currentInvitation.theme.textColor = template.colors.text;
        state.currentInvitation.theme.accentColor = template.colors.accent;
        state.currentInvitation.theme.fontFamily = template.font;
      }
    },
    toggleFavorite: (state, action) => {
      const id = action.payload;
      const idx = state.favoriteTemplates.indexOf(id);
      if (idx >= 0) state.favoriteTemplates.splice(idx, 1);
      else state.favoriteTemplates.push(id);
    },
    setActiveCategory: (state, action) => {
      state.activeCategory = action.payload;
    },
    setPreviewDevice: (state, action) => {
      state.previewDevice = action.payload;
    },
    resetBuilder: (state) => {
      state.currentInvitation = { ...defaultInvitation };
      state.aiContent = null;
    },
    loadInvitation: (state, action) => {
      state.currentInvitation = { ...defaultInvitation, ...action.payload };
    },
    setInvitationStatus: (state, action) => {
      state.currentInvitation.status = action.payload;
    },
    clearAIContent: (state) => {
      state.aiContent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch invitations
      .addCase(fetchInvitations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInvitations.fulfilled, (state, action) => { state.loading = false; state.invitations = action.payload; })
      .addCase(fetchInvitations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Create
      .addCase(createInvitation.pending, (state) => { state.loading = true; })
      .addCase(createInvitation.fulfilled, (state, action) => { state.loading = false; state.invitations.unshift(action.payload); })
      .addCase(createInvitation.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Update
      .addCase(updateInvitation.fulfilled, (state, action) => {
        const idx = state.invitations.findIndex(i => i._id === action.payload._id);
        if (idx >= 0) state.invitations[idx] = { ...state.invitations[idx], ...action.payload };
      })
      // Delete
      .addCase(deleteInvitation.fulfilled, (state, action) => {
        state.invitations = state.invitations.filter(i => i._id !== action.payload);
      })
      // AI Content
      .addCase(generateAIContent.pending, (state) => { state.aiLoading = true; })
      .addCase(generateAIContent.fulfilled, (state, action) => { state.aiLoading = false; state.aiContent = action.payload; })
      .addCase(generateAIContent.rejected, (state, action) => { state.aiLoading = false; state.error = action.payload; });
  },
});

export const {
  updateCouple, updateEvent, updateSubEvent, updateRSVP,
  updateTheme, updateMedia, updateAdvanced, selectTemplate,
  toggleFavorite, setActiveCategory, setPreviewDevice,
  resetBuilder, loadInvitation, setInvitationStatus, clearAIContent,
} = invitationSlice.actions;

export default invitationSlice.reducer;
