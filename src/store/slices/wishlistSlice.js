import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: []
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist(state, action){
      if(!state.items.find(i => i.id === action.payload.id)){
        state.items.push(action.payload)
      }
    },
    removeFromWishlist(state, action){
      state.items = state.items.filter(i => i.id !== action.payload)
    }
  }
})

export const { addToWishlist, removeFromWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
