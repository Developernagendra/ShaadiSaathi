import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export const createPaymentOrder = createAsyncThunk('payment/createOrder', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/payments/create-order', payload)
    return res.data
  } catch (err) {
    const msg = err?.message || err?.response?.data?.message || (typeof err === 'string' ? err : 'Failed to create payment order');
    return rejectWithValue(msg)
  }
})

export const verifyPayment = createAsyncThunk('payment/verify', async (paymentData, { rejectWithValue }) => {
  try {
    const res = await api.post('/payments/verify', paymentData)
    return res.data
  } catch (err) {
    const msg = err?.message || err?.response?.data?.message || (typeof err === 'string' ? err : 'Payment verification failed');
    return rejectWithValue(msg)
  }
})

export const fetchPaymentHistory = createAsyncThunk('payment/fetchHistory', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/payments/history')
    return res.data
  } catch (err) {
    const msg = err?.message || err?.response?.data?.message || (typeof err === 'string' ? err : 'Failed to fetch payment history');
    return rejectWithValue(msg)
  }
})

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    order: null,
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearOrder: (state) => { state.order = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentOrder.pending, (state) => { state.loading = true })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.loading = false
        state.order = action.payload
      })
      .addCase(createPaymentOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(verifyPayment.pending, (state) => { state.loading = true })
      .addCase(verifyPayment.fulfilled, (state) => {
        state.loading = false
        state.order = null
        toast.success('Payment successful!')
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false
        toast.error(action.payload)
      })

      .addCase(fetchPaymentHistory.fulfilled, (state, action) => { state.history = action.payload.payments })
  }
})

export const { clearOrder } = paymentSlice.actions
export default paymentSlice.reducer
