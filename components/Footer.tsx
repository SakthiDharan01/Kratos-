'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Instagram, Linkedin, Mail, Phone, MapPin, Calendar, ExternalLink } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Logo & Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent mb-2">
                  KRATOS 2025
                </h2>
                <p className="text-gray-400 mb-4">
                  Technical Symposium organized by the Association of Computer Engineers
                </p>
                <div className="flex items-center text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-orange-400" />
                  <span className="text-sm">Easwari Engineering College, Chennai</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-4 h-4 mr-2 text-orange-400" />
                  <span className="text-sm">Mark Your Calenders on 10th September 2025</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                <motion.a
                  href="https://www.linkedin.com/in/cse-department-easwari-engineering-college-3b099b314/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  <Linkedin className="w-5 h-5" />
                </motion.a>
                <motion.a
                  href="https://www.instagram.com/kratos_2k25?igsh=Nm90Yjdnd2owcTM4"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-gradient-to-r from-pink-600 to-rose-700 p-3 rounded-full hover:from-pink-700 hover:to-rose-800 transition-all duration-300 shadow-lg hover:shadow-pink-500/25"
                >
                  <Instagram className="w-5 h-5" />
                </motion.a>
                <motion.a
                  href="mailto:updates.kratos@gmail.com"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-gradient-to-r from-orange-600 to-red-700 p-3 rounded-full hover:from-orange-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-orange-500/25"
                >
                  <Mail className="w-5 h-5" />
                </motion.a>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Event Categories</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/technical" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                    <span>Technical Events</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/no-code" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                    <span>Spark Events</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/playground" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                    <span>PlayGround</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/online" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                    <span>Online Events</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/hackathon" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                    <span>HTF Hackathon</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/conference" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                    <span>Conference</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* Support & Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Support & Info</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/profile" className="text-gray-300 hover:text-orange-400 transition-colors duration-300">
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="text-gray-300 hover:text-orange-400 transition-colors duration-300">
                    Registration Cart
                  </Link>
                </li>
                <li>
                  <Link href="/receipt" className="text-gray-300 hover:text-orange-400 transition-colors duration-300">
                    My Receipts
                  </Link>
                </li>
                <li>
                  <a href="mailto:updates.kratos@gmail.com" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Support
                  </a>
                </li>
                <li>
                  <a href="tel:+91-XXXXXXXXXX" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Us
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800"></div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="py-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} KRATOS 2K25 - All Rights Reserved
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Organized by Association of Computer Engineers, Easwari Engineering College
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-xs text-gray-500">
                <span className="block">Made with ❤️ for students</span>
                <span className="block text-center">by ACE Club</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500"></div>
    </footer>
  )
}