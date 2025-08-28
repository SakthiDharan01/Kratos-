'use client'

import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { Calendar, Clock, Trophy, Users, Rocket, Gamepad2, Sprout, Heart, Monitor, Star, Gift } from 'lucide-react'

export default function HackathonPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-black py-20"
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <div className="relative max-w-6xl mx-auto px-4 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-yellow-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-4">
                🚀 Hack to the Future
              </h1>
              <p className="text-2xl md:text-3xl text-gray-300 font-medium mb-6">
                "Code today, change tomorrow."
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-lg">
                <span className="bg-red-600 px-4 py-2 rounded-full font-bold">
                  First-ever Kratos 2k25 Hackathon
                </span>
                <span className="text-yellow-400 font-semibold">October 9th</span>
              </div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
            >
              Get ready to innovate, build, and shape the future. Hack to the Future is a thrilling 12-hour hackathon 
              bringing together the brightest minds to tackle real-world challenges with creativity and technology!
            </motion.p>
          </div>
        </motion.div>

        {/* Duration Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="py-16 bg-gray-900/50"
        >
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-2xl p-8 mb-8">
              <Clock className="w-16 h-16 mx-auto mb-4 text-white" />
              <h2 className="text-4xl font-bold text-white mb-2">🕒 Duration</h2>
              <p className="text-2xl font-bold text-yellow-300">12 Hours</p>
              <p className="text-lg text-gray-200">Non-stop coding, building, and problem-solving.</p>
            </div>
          </div>
        </motion.section>

        {/* Problem Statement Tracks */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="py-16"
        >
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-yellow-400 mb-12">
              🎯 Problem Statement Tracks
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-blue-900 to-purple-900 p-6 rounded-xl border border-blue-500/30"
              >
                <Rocket className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">🌌 Space Technology</h3>
                <p className="text-gray-300">Push the boundaries beyond Earth.</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-green-900 to-teal-900 p-6 rounded-xl border border-green-500/30"
              >
                <Gamepad2 className="w-12 h-12 text-green-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">🎮 Gamified Solutions</h3>
                <p className="text-gray-300">Make learning, work, and life more fun through gamification.</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-yellow-900 to-orange-900 p-6 rounded-xl border border-yellow-500/30"
              >
                <Sprout className="w-12 h-12 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">🌱 Agriculture</h3>
                <p className="text-gray-300">Tech for smarter and sustainable farming.</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-red-900 to-pink-900 p-6 rounded-xl border border-red-500/30"
              >
                <Heart className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">🏥 Healthcare</h3>
                <p className="text-gray-300">Innovate to save lives and enhance well-being.</p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="py-16 bg-gray-900/50"
        >
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-yellow-400 mb-8">🖥 How It Works</h2>
            <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-8">
              <Monitor className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <p className="text-xl text-white">
                💻 Hackathon powered by <span className="font-bold text-yellow-400">Devfolio</span> for seamless participation and submissions.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Prizes */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="py-16"
        >
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-yellow-400 mb-12">
              🏆 Prizes & Perks
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-yellow-600 to-orange-600 p-6 rounded-xl text-center"
              >
                <Trophy className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-bold text-white mb-2">🥇 First Prize</h3>
                <p className="text-yellow-100">[Add Actual Amount/Details Soon]</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-gray-500 to-gray-600 p-6 rounded-xl text-center"
              >
                <Trophy className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-bold text-white mb-2">🥈 Second Prize</h3>
                <p className="text-gray-200">[Add Amount/Details]</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-orange-600 to-red-600 p-6 rounded-xl text-center"
              >
                <Trophy className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-bold text-white mb-2">🥉 Third Prize</h3>
                <p className="text-orange-200">[Add Amount/Details]</p>
              </motion.div>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-purple-800 to-pink-800 rounded-2xl p-8 text-center"
            >
              <Gift className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-2xl font-bold text-white mb-2">🎁 Special Tracks & Goodies</h3>
              <p className="text-lg text-pink-200">Swags, exclusive certificates, and unique opportunities await!</p>
            </motion.div>
          </div>
        </motion.section>

        {/* Why Participate */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="py-16 bg-gray-900/50"
        >
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-yellow-400 mb-12">
              🌟 Why Participate?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <Star className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Showcase Your Skills</h3>
                  <p className="text-gray-300">Showcase your coding and innovation skills in front of experts and peers.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Star className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Build Solutions</h3>
                  <p className="text-gray-300">Build meaningful solutions for pressing global problems.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Star className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Win Prizes</h3>
                  <p className="text-gray-300">Compete for exciting prizes and real-world recognition.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Star className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Network</h3>
                  <p className="text-gray-300">Network with innovators, mentors, and recruiters.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Event Details */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="py-16"
        >
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-yellow-400 mb-12">
              📅 Event Details
            </h2>
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-2xl font-bold text-white mb-2">Date</h3>
                  <p className="text-xl text-blue-200">October 9th</p>
                </div>
                
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-2xl font-bold text-white mb-2">Duration</h3>
                  <p className="text-xl text-purple-200">12 Hours</p>
                </div>
                
                <div className="text-center">
                  <Monitor className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
                  <h3 className="text-2xl font-bold text-white mb-2">Mode</h3>
                  <p className="text-xl text-cyan-200">On Devfolio</p>
                </div>
                
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <h3 className="text-2xl font-bold text-white mb-2">Registration</h3>
                  <p className="text-xl text-green-200">Coming Soon!</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="py-16 bg-gradient-to-r from-red-600 to-purple-600"
        >
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">🎉 Special Note</h2>
            <p className="text-xl text-gray-100 mb-8">
              This is the <span className="font-bold text-yellow-300">first ever hackathon</span> hosted by the Kratos Symposium. 
              Don't miss your chance to make history!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 px-8 rounded-xl text-xl transition-colors"
              onClick={() => {
                // Add registration link when available
                alert('Registration link coming soon!')
              }}
            >
              👉 Register Now & Make History!
            </motion.button>
          </div>
        </motion.section>
      </div>
    </Layout>
  )
}
