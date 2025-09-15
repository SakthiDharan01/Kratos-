import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Event {
  id: number
  name: string
  description: string
  description_detailed?: string
  rules: string
  price: number
  min_team_size: number
  max_team_size: number
  category: 'technical' | 'no_code' | 'playground' | 'online' | 'workshops'
  event_type: 'team' | 'solo'
  status: 'open' | 'closed' | 'completed'
  participant_limit: number
  current_registrations?: number | null
  event_date: string
  time_slot?: 'morning' | 'afternoon' | 'both' | null
  venue: string
  rounds?: string | null
  incharge_name1: string
  incharge_phone1: string
  incharge_name2: string
  incharge_phone2: string
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

export interface FormDraftData {
  events: Array<{
    eventId: string
    teamName: string
    participants: Array<{
      name: string
      email: string
      phone: string
      college: string
      department: string
      year: string
      sameAsLeader?: boolean
    }>
  }>
  total: number
  userId?: string
  timestamp: number
}

interface StoreState {
  user: User | null
  cart: CartItem[]
  isAuthenticated: boolean
  formDraft: FormDraftData | null
  setUser: (user: User | null) => void
  setAuthenticated: (status: boolean) => void
  addToCart: (event: Event, teamSize: number) => void
  removeFromCart: (eventId: number) => void
  updateCartItem: (eventId: number, teamSize: number) => void
  clearCart: () => void
  clearPaidItemsFromCart: (paidEventIds: number[]) => void
  getCartTotal: () => number
  registrationDraft: any
  setRegistrationDraft: (data: any) => void
  saveFormDraft: (data: FormDraftData) => void
  clearFormDraft: () => void
  isProfileComplete: () => boolean
  checkUserRegistrationStatus: () => Promise<{hasRegistration: boolean, eventName?: string}>
  checkEventRegistrationStatus: (eventId: number) => Promise<{isRegistered: boolean, eventName?: string}>
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      isAuthenticated: false,
      formDraft: null,
      setUser: (user) => {
        console.log('Store: Setting user:', user?.id || 'null')
        set({ user })
      },
      setAuthenticated: (status) => {
        console.log('Store: Setting authenticated:', status)
        set({ isAuthenticated: status })
      },
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
      clearPaidItemsFromCart: (paidEventIds) => {
        set({
          cart: get().cart.filter(item => !paidEventIds.includes(item.event.id))
        })
      },
      getCartTotal: () => {
        return get().cart.reduce((total, item) => {
          // Price is per team/event, not per participant
          return total + item.event.price
        }, 0)
      },
      registrationDraft: null,
      setRegistrationDraft: (data) => set({ registrationDraft: data }),
      saveFormDraft: (data) => {
        try {
          set({ 
            formDraft: { 
              ...data, 
              timestamp: Date.now() 
            } 
          });
        } catch (error) {
          console.error('Error saving form draft:', error);
        }
      },
      clearFormDraft: () => set({ formDraft: null }),
      isProfileComplete: () => {
        const user = get().user
        if (!user) return false
        return !!(user.name && user.email && user.phone && user.college && user.department && user.year)
      },
      checkUserRegistrationStatus: async () => {
        const user = get().user
        if (!user) return { hasRegistration: false }
        
        try {
          // Import supabase dynamically to avoid circular dependency
          const { supabase } = await import('@/lib/supabase')
          
          // Check if user has any existing PAID registrations (as leader or participant)
          const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
              id,
              event_id,
              leader_id,
              registrants!inner(payment_status),
              events(name)
            `)
            .or(`email.eq.${user.email},phone.eq.${user.phone}`)
            .eq('registrants.payment_status', 'paid')
            .limit(1)

          if (error) {
            console.error('Error checking registration status:', error)
            return { hasRegistration: false }
          }

          if (registrations && registrations.length > 0) {
            const registration = registrations[0]
            return { 
              hasRegistration: true, 
              eventName: (registration.events as any)?.name || 'Unknown Event'
            }
          }

          return { hasRegistration: false }
        } catch (error) {
          console.error('Error in checkUserRegistrationStatus:', error)
          return { hasRegistration: false }
        }
      },
      checkEventRegistrationStatus: async (eventId: number) => {
        const user = get().user
        if (!user) return { isRegistered: false }
        
        try {
          // Import supabase dynamically to avoid circular dependency
          const { supabase } = await import('@/lib/supabase')
          
          // Check if user has PAID registration for this specific event only
          const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
              id,
              event_id,
              leader_id,
              registrants!inner(payment_status),
              events(name)
            `)
            .or(`email.eq.${user.email},phone.eq.${user.phone}`)
            .eq('event_id', eventId)
            .eq('registrants.payment_status', 'paid')
            .limit(1)

          if (error) {
            console.error('Error checking event registration status:', error)
            return { isRegistered: false }
          }

          if (registrations && registrations.length > 0) {
            const registration = registrations[0]
            return { 
              isRegistered: true, 
              eventName: (registration.events as any)?.name || 'Unknown Event'
            }
          }

          return { isRegistered: false }
        } catch (error) {
          console.error('Error in checkEventRegistrationStatus:', error)
          return { isRegistered: false }
        }
      }
    }),
    {
      name: 'event-store',
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        isAuthenticated: state.isAuthenticated,
        registrationDraft: state.registrationDraft,
        // Exclude formDraft from persistence to avoid hydration issues
      }),
      version: 1, // Add version for potential future migrations
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Store: Successfully rehydrated with user:', state.user?.id || 'null', 'authenticated:', state.isAuthenticated);
        } else {
          console.log('Store: Failed to rehydrate state');
        }
      },
    }
  )
)