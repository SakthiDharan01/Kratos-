'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Code, Lightbulb, Trophy, ArrowRight, Zap, Cpu, Globe, Shield, Rocket } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Countdown } from '@/components/Countdown'
import HackathonLayout from '@/components/HackathonLayout'

export default function HTFCountdownPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  // Track mouse for parallax effect
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial window size
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('mousemove', updateMousePosition)
    window.addEventListener('resize', updateWindowSize)
    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
      window.removeEventListener('resize', updateWindowSize)
    }
  }, [])

  // Floating tech elements
  const techElements = [
    { icon: <Cpu className="w-6 h-6" />, delay: 0, duration: 6 },
    { icon: <Code className="w-5 h-5" />, delay: 1, duration: 8 },
    { icon: <Globe className="w-7 h-7" />, delay: 2, duration: 7 },
    { icon: <Shield className="w-5 h-5" />, delay: 0.5, duration: 9 },
    { icon: <Rocket className="w-6 h-6" />, delay: 1.5, duration: 5 },
    { icon: <Zap className="w-4 h-4" />, delay: 2.5, duration: 6 }
  ]

  return (
    <HackathonLayout>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white relative overflow-hidden">
        {/* Animated Tech Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Grid Pattern */}
          <div className="absolute inset-0 w-full h-full bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          
          {/* Floating Tech Elements */}
          {windowSize.width > 0 && techElements.map((element, index) => (
            <motion.div
              key={index}
              className="absolute text-blue-400/20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0],
                x: [Math.random() * windowSize.width, Math.random() * windowSize.width],
                y: [Math.random() * windowSize.height, Math.random() * windowSize.height],
                rotate: [0, 360]
              }}
              transition={{
                duration: element.duration,
                delay: element.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {element.icon}
            </motion.div>
          ))}

          {/* Parallax Orbs */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              x: mousePosition.x * 0.02,
              y: mousePosition.y * 0.02,
            }}
            transition={{ type: "spring", damping: 30 }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
            animate={{
              x: mousePosition.x * -0.03,
              y: mousePosition.y * -0.03,
            }}
            transition={{ type: "spring", damping: 25 }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Institution Logos - Right below navbar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-start items-center gap-6 px-6 py-6"
          >
            <img
              src="/assets/ace-bw.png"
              alt="ACE Logo"
              className="h-16 w-auto opacity-80 hover:opacity-100 transition-opacity"
            />
            <img
              src="/assets/easwari-bw.png"
              alt="Easwari Engineering College Logo"
              className="h-16 w-auto opacity-80 hover:opacity-100 transition-opacity"
            />
          </motion.div>

          {/* Hero Section */}
          <section className="min-h-screen flex items-center justify-center pt-20">
            <div className="container mx-auto px-6 text-center">

              {/* Hack to the Future Logo */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="mb-12"
              >
                <div className="relative">
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        "0 0 20px rgba(59, 130, 246, 0.3)",
                        "0 0 40px rgba(59, 130, 246, 0.5)",
                        "0 0 20px rgba(59, 130, 246, 0.3)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="rounded-2xl p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-500/30"
                  >
                    <Image 
                      src="/hackathon/hack-the future.png" 
                      alt="HACK TO THE FUTURE - First Ever Hackathon by ACE"
                      width={800}
                      height={250}
                      className="mx-auto max-w-full h-auto"
                      priority
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* Partner Logos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 mb-16"
              >
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-4">Powered by</p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img
                      src="/hackathon/devfolio-logo.png"
                      alt="Devfolio"
                      className="w-40 h-auto object-contain opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-lg"
                    />
                  </motion.div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-4">In partnership with</p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img
                      src="/hackathon/ethindia-logo.png"
                      alt="ETHIndia"
                      className="w-48 h-auto object-contain opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-lg"
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="mb-16"
              >
                <h2 className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  <span className="text-blue-400 font-semibold">History in the making!</span> Join us for the inaugural hackathon 
                  as part of <span className="text-yellow-400 font-semibold">Kratos'25 Technical Symposium</span>. 
                  Be among the pioneers who shape the future of innovation at Easwari Engineering College.
                </h2>
              </motion.div>

              {/* Countdown Component */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.8 }}
                className="mb-16"
              >
                <Countdown 
                  targetDate="2025-09-28T00:00:00"
                  title="Registration Closes In "
                  subtitle="Prepare to hack the future and make history with us!"
                  onComplete={() => {
                    console.log("HTF Registration is now open!")
                  }}
                />
              </motion.div>

              {/* Call to Action */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.8 }}
                className="flex justify-center items-center"
              >
                {/* Apply button injected here (converted to JSX) */}
                <div
                  className="apply-button"
                  data-hackathon-slug="hacktothefuture"
                  data-button-theme="dark"
                  style={{ height: '44px', width: '312px' }}
                />

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href="/"
                    className="inline-flex items-center gap-2 border-2 border-blue-400 text-blue-400 font-bold py-4 px-8 rounded-xl hover:bg-blue-400 hover:text-black transition-all duration-300"
                  >
                    Back to Kratos'25
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </motion.div>

              {/* Additional Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.8 }}
                className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
              >
                {[
                  { icon: <Users className="w-6 h-6" />, title: "Team Event", desc: "Form teams of 3-4 members" },
                  { icon: <Clock className="w-6 h-6" />, title: "12 Hours", desc: "Non-stop innovation sprint" },
                  { icon: <Trophy className="w-6 h-6" />, title: "Amazing Prizes", desc: "Win exciting rewards & recognition" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2 + index * 0.1, duration: 0.6 }}
                    className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 text-center"
                  >
                    <div className="text-blue-400 mb-3 flex justify-center">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-300 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        </div>
      </div>
    </HackathonLayout>
  )
}
