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
    { name: 'Spark Events', href: '/no-code' },
    { name: 'PlayGround', href: '/playground' },
    { name: 'Online Events', href: '/online' },
    { name: 'Workshops', href: '/workshops' },
    { name: 'Hack to the Future', href: '/htf' },
    { name: 'Paper Conference', href: '/conference' }
  ]

  // Check if we're on the HTF page for special styling
  const isHTFPage = pathname === '/htf'

  // Handle keyboard navigation for mobile menu
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isMenuOpen) {
      setIsMenuOpen(false)
    }
  }

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
      className={`backdrop-blur-md border-b sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHTFPage 
          ? 'bg-gradient-to-r from-purple-900/90 via-blue-900/90 to-indigo-900/90 border-cyan-500/30 shadow-lg shadow-cyan-500/20' 
          : 'bg-black/90 border-red-500/20'
      }`}
      initial={false}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-bold text-yellow-400">
            <div className="flex items-center space-x-2">
              <img
                src="/assets/Badge.png"
                alt="name"
                className="w-10 sm:w-12 h-auto"
              />
              <p className="hidden sm:block">
                KRATOS 2k25
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-4 xl:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-xs xl:text-sm font-medium transition-all duration-300 px-2 py-1 rounded ${
                  pathname === item.href 
                    ? (isHTFPage 
                        ? 'text-cyan-300 glow-cyan' 
                        : 'text-yellow-400')
                    : (isHTFPage 
                        ? 'text-white hover:text-cyan-300 hover:glow-cyan' 
                        : 'text-white hover:text-yellow-400')
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-2 text-white hover:text-yellow-400 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label={`Shopping cart with ${cartItemsCount} items`}
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  {cartItemsCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs"
                      aria-hidden="true"
                    >
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className="p-2 text-white hover:text-yellow-400 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="View profile"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white hover:text-red-400 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onKeyDown={handleKeyDown}
              className="lg:hidden p-2 text-white hover:text-yellow-400 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`lg:hidden border-t ${
                isHTFPage ? 'border-cyan-500/30' : 'border-red-500/20'
              }`}
              id="mobile-menu"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <div className="py-4 space-y-1 max-h-screen overflow-y-auto">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-inset ${
                      pathname === item.href 
                        ? (isHTFPage 
                            ? 'text-cyan-300 glow-cyan bg-cyan-500/10 focus:ring-cyan-400' 
                            : 'text-yellow-400 bg-yellow-400/10 focus:ring-yellow-400')
                        : (isHTFPage 
                            ? 'text-white hover:text-cyan-300 hover:glow-cyan hover:bg-cyan-500/5' 
                            : 'text-white hover:text-yellow-400 hover:bg-yellow-400/5')
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
