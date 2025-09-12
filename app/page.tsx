'use client'

import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { Calendar, Trophy, Users, Zap } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const features = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Focused Tracks',
      description: 'Technical • Spark • PlayGround • Online'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Team Participation',
      description: 'Form teams of various sizes for different events'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Win Prizes',
      description: 'Compete for exciting prizes and recognition'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Easy Registration',
      description: 'Simple phone-based authentication and registration'
    }
  ]

  const eventCategories = [
    {
      title: 'Technical',
      description: 'Core coding challenges',
      href: '/technical',
      color: 'from-red-500 to-orange-600'
    },
    {
      title: 'Spark',
      description: 'Imagine. Create. Celebrate, Just Spark!',
      href: '/no-code',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      title: 'PlayGround',
      description: 'Play Bold. Score Big. Shine Together!',
      href: '/playground',
      color: 'from-green-500 to-teal-600'
    },
    {
      title: 'Online Events',
      description: 'Remote participation challenges',
      href: '/online',
      color: 'from-yellow-500 to-red-600'
    },
    {
      title: 'Hackathon', 
      description: '12-hour coding marathon', 
      href: '/hackathon', 
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Paper Conference', 
      description: 'IEEE Paper Presentation',
      href: '/conference', 
      color: 'from-pink-500 to-rose-600'
    }
  ]

  return (
    <Layout>
      <div className="space-y-0">
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
        <section className="text-center py-0 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Main Kratos Logo - Centered and Smaller */}
            <div className="flex items-center justify-center relative pt-24 pb-8">
              <img
                src="/assets/name.png"
                alt="Kratos 2K25 Logo"
                className="w-auto h-24 md:h-32 lg:h-40"
              />
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto py-12">
              Join the ultimate technical festival with exciting competitions, 
              innovative challenges, and amazing prizes
            </p>
          </motion.div>
        </section>

        {/* Features Section */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold text-yellow-400 text-center mb-12"
          >
            Why Join Kratos 2k25?
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-gray-900/30 border border-red-500/20 rounded-xl backdrop-blur-sm hover:border-red-500/40 transition-all duration-300"
              >
                <div className="text-red-500 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Event Categories */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold text-yellow-400 text-center mb-12"
          >
            <br></br>
            Event Categories
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {eventCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Link href={category.href} className="block">
                  <div className={`bg-gradient-to-br ${category.color} p-6 rounded-xl text-white h-full`}>
                    <h3 className="text-xl font-bold mb-3">{category.title}</h3>
                    <p className="text-white/90 text-sm">{category.description}</p>
                    <div className="mt-4">
                      <span className="text-xs font-medium">Explore Events →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-600 to-maroon-700 p-8 rounded-2xl"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Showcase Your Skills?
            </h2>
            <p className="text-white/90 mb-6 text-lg">
              Register now and be part of the most exciting technical festival!
            </p>
            <Link
              href="/technical"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-lg transition-colors inline-block"
            >
              Explore Technical Events
            </Link>
          </motion.div>
        </section>
      </div>
    </Layout>
  )
}