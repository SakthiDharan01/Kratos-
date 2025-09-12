'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, LogOut, Menu, X, Zap, Code, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function HackathonNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, cart, isAuthenticated, setUser, setAuthenticated, clearCart } = useStore()
  
  const navigation = [
    { name: 'Home', href: '/', icon: null },
    { name: 'Hackathons', href: '/hackathon', icon: Code },
    { name: 'HTF 2025', href: '/htf', icon: Zap },
    { name: 'Tech Events', href: '/technical', icon: Trophy },
    { name: 'All Events', href: '/', icon: Users }
  ]

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
      className="backdrop-blur-md bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-indigo-900/95 border-b border-cyan-400/30 sticky top-0 left-0 right-0 z-50 shadow-lg shadow-cyan-500/20"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Hackathon Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <img
                src="/assets/Badge.png"
                alt="Hackathon Badge"
                className="w-10 sm:w-12 h-auto filter brightness-110"
              />
              <div className="absolute -top-1 -right-1 w-2 sm:w-3 h-2 sm:h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                KRATOS 2k25
              </h1>
              <p className="text-xs text-cyan-300 font-medium tracking-wider">HACKATHON MODE</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-4 xl:space-x-6">
            {navigation.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    pathname === item.href 
                      ? 'text-cyan-300 bg-cyan-500/20 shadow-lg shadow-cyan-500/30 glow-cyan' 
                      : 'text-white hover:text-cyan-300 hover:bg-cyan-500/10'
                  }`}
                >
                  {IconComponent && <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />}
                  <span className="hidden xl:inline">{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-2 text-white hover:text-cyan-300 transition-all duration-300 hover:scale-110"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  {cartItemsCount > 0 && (
                    <motion.span 
                      className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className="p-2 text-white hover:text-cyan-300 transition-all duration-300 hover:scale-110"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white hover:text-red-400 transition-all duration-300 hover:scale-110"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 text-sm"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-white hover:text-cyan-300 transition-colors"
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
              className="lg:hidden border-t border-cyan-400/30"
            >
              <div className="py-4 space-y-1 max-h-screen overflow-y-auto">
                {navigation.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        pathname === item.href 
                          ? 'text-cyan-300 bg-cyan-500/20 glow-cyan' 
                          : 'text-white hover:text-cyan-300 hover:bg-cyan-500/10'
                      }`}
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Animated border bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
    </motion.nav>
  )
}