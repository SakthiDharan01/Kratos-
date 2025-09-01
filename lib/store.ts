import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Event {
  id: number
  name: string
  description: string
  event_type: 'team' | 'solo'
  rules: string
  price: number
  event_date: string
  time_slot: 'slot1' | 'slot2' | 'both'
  slot_duration: 'single' | 'double'
  start_time: string
  end_time: string
  category: 'technical' | 'no_code' | 'playground' | 'online'
  incharge_name1: string
  incharge_phone1: string
  incharge_name2: string
  incharge_phone2: string
  participant_limit: number
  current_registrations: number
  registration_start: string
  registration_end: string
  status: 'open' | 'closed' | 'completed'
  created_at: string
  updated_at: string
}

export interface CartItem {
  event: Event
  quantity: number
  teamSize: number
}

export interface User {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  phone: string
  department: string
  year: '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Graduate'
  college: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface StoreState {
  user: User | null
  cart: CartItem[]
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setAuthenticated: (status: boolean) => void
  addToCart: (event: Event, teamSize: number) => void
  removeFromCart: (eventId: string | number) => void
  updateCartItem: (eventId: string | number, teamSize: number) => void
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
      removeFromCart: (eventId: string | number) => {
        set({
          cart: get().cart.filter(item => item.event.id.toString() !== eventId.toString())
        })
      },
      updateCartItem: (eventId: string | number, teamSize: number) => {
        set({
          cart: get().cart.map(item =>
            item.event.id.toString() === eventId.toString()
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