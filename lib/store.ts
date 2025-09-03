import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Event {
  id: number
  name: string
  description: string
  rules?: string | null
  price: number
  min_team_size: number
  max_team_size: number
  category: string
  event_type: 'team' | 'solo'
  status: 'open' | 'closed' | 'completed'
  participant_limit?: number | null
  current_registrations?: number | null
  registration_start?: string | null
  registration_end?: string | null
  event_date?: string | null
  time_slot?: 'slot1' | 'slot2' | 'both' | null
  slot_duration?: 'single' | 'double' | null
  start_time?: string | null
  end_time?: string | null
  incharge_name1?: string | null
  incharge_phone1?: string | null
  incharge_name2?: string | null
  incharge_phone2?: string | null
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
  removeFromCart: (eventId: number) => void
  updateCartItem: (eventId: number, teamSize: number) => void
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