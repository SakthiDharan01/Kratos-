'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface NavbarProps {
  enableAutoHide?: boolean
}

export default function Navbar({ enableAutoHide = false }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const pathname = usePathname()
  const { user, cart, isAuthenticated, setUser, setAuthenticated, clearCart } = useStore()
  
  console.log('Navbar - enableAutoHide:', enableAutoHide, 'isVisible:', isVisible, 'pathname:', pathname)
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Technical', href: '/technical' },
    { name: 'No-Code', href: '/no-code' },
    { name: 'PlayGround', href: '/playground' },
    { name: 'Online', href: '/online' },
  ]

  // Auto-hide navbar logic - only when enableAutoHide is true
  useEffect(() => {
    if (!enableAutoHide) {
      setIsVisible(true)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show navbar when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 200) {
        setIsVisible(true)
      } else {
        // Hide navbar when scrolling down
        setIsVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    // Only add scroll listener when auto-hide is enabled
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, enableAutoHide])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAuthenticated(false)
    clearCart()
    toast.success('Logged out successfully')
  }

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <motion.nav 
    className="bg-black/90 backdrop-blur-md border-b border-red-500/20 sticky top-0 left-0 right-0 z-50"
      initial={false}
    animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-yellow-400">
            <div className="flex items-center space-x-2">
              <img
                src="/assets/Badge.png"
                alt="name"
                className="w-12 h-auto"
              />
              <p>
                KRATOS 2k25
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-yellow-400 ${
                  pathname === item.href ? 'text-yellow-400' : 'text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-2 text-white hover:text-yellow-400 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className="p-2 text-white hover:text-yellow-400 transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white hover:text-yellow-400 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-red-500/20"
            >
              <div className="py-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-2 text-sm font-medium transition-colors hover:text-yellow-400 ${
                      pathname === item.href ? 'text-yellow-400' : 'text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}