'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, LogOut, Menu, X, FileText, Users, Award, BookOpen, Presentation } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ConferenceNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, cart, isAuthenticated, setUser, setAuthenticated, clearCart } = useStore()
  
  const navigation = [
    { name: 'Home', href: '/', icon: null },
    { name: 'Conference', href: '/conference', icon: Presentation },
    { name: 'Technical', href: '/technical', icon: Award },
    { name: 'Research', href: '/conference', icon: BookOpen },
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
      className="backdrop-blur-md bg-gradient-to-r from-slate-900/95 via-gray-900/95 to-slate-800/95 border-b border-amber-400/30 sticky top-0 left-0 right-0 z-50 shadow-lg shadow-amber-500/20"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Conference Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="/assets/Badge.png"
                alt="Conference Badge"
                className="w-12 h-auto filter sepia brightness-110"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                KRATOS 2k25
              </h1>
              <p className="text-xs text-amber-300 font-medium tracking-wider">RESEARCH CONFERENCE</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navigation.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    pathname === item.href 
                      ? 'text-amber-300 bg-amber-500/20 shadow-lg shadow-amber-500/30' 
                      : 'text-white hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-2 text-white hover:text-amber-300 transition-all duration-300 hover:scale-110"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <motion.span 
                      className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
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
                  className="p-2 text-white hover:text-amber-300 transition-all duration-300 hover:scale-110"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white hover:text-red-400 transition-all duration-300 hover:scale-110"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/30"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white hover:text-amber-300 transition-colors"
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
              className="md:hidden border-t border-amber-400/30"
            >
              <div className="py-4 space-y-2">
                {navigation.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        pathname === item.href 
                          ? 'text-amber-300 bg-amber-500/20' 
                          : 'text-white hover:text-amber-300 hover:bg-amber-500/10'
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
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse"></div>
    </motion.nav>
  )
}