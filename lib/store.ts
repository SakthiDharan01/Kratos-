import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Event {
  id: string
  name: string
  description: string
  rules?: string | null
  price: number
  min_team_size: number
  max_team_size: number
  category: string
}

export interface CartItem {
  event: Event
  quantity: number
  teamSize: number
}

export interface User {
  id: string
  phone: string
  name: string
  email: string
  college: string
  department: string
  year: string
}

interface StoreState {
  user: User | null
  cart: CartItem[]
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setAuthenticated: (status: boolean) => void
  addToCart: (event: Event, teamSize: number) => void
  removeFromCart: (eventId: string) => void
  updateCartItem: (eventId: string, teamSize: number) => void
  clearCart: () => void
  getCartTotal: () => number
  registrationDraft: any
  setRegistrationDraft: (data: any) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      isAuthenticated: false,
      setUser: (user) => set({ user }),
      setAuthenticated: (status) => set({ isAuthenticated: status }),
      addToCart: (event, teamSize) => {
        const cart = get().cart
        const existingItem = cart.find(item => item.event.id === event.id)
        
        if (existingItem) {
          set({
            cart: cart.map(item =>
              item.event.id === event.id
                ? { ...item, teamSize, quantity: 1 }
                : item
            )
          })
        } else {
          set({
            cart: [...cart, { event, quantity: 1, teamSize }]
          })
        }
      },
      removeFromCart: (eventId) => {
        set({
          cart: get().cart.filter(item => item.event.id !== eventId)
        })
      },
      updateCartItem: (eventId, teamSize) => {
        set({
          cart: get().cart.map(item =>
            item.event.id === eventId
              ? { ...item, teamSize }
              : item
          )
        })
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        return get().cart.reduce((total, item) => {
          return total + (item.event.price * item.teamSize)
        }, 0)
      },
  registrationDraft: null,
  setRegistrationDraft: (data) => set({ registrationDraft: data }),
    }),
    {
      name: 'event-store',
    }
  )
)