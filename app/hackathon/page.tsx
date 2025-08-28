'use client'

import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { Calendar, Clock, Trophy, Users, Rocket, Gamepad2, Sprout, Heart, Monitor, Star, Gift, Target, Code, Award } from 'lucide-react'
import Link from 'next/link'

export default function HackathonPage() {
  const tracks = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'Space Technology',
      description: 'Push the boundaries beyond Earth.'
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: 'Gamified Solutions', 
      description: 'Make learning, work, and life more fun through gamification.'
    },
    {
      icon: <Sprout className="w-8 h-8" />,
      title: 'Agriculture',
      description: 'Tech for smarter and sustainable farming.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Healthcare',
      description: 'Innovate to save lives and enhance well-being.'
    }
  ]

  const whyParticipate = [
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Showcase Your Skills',
      description: 'Showcase your coding and innovation skills in front of experts and peers'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Build Solutions',
      description: 'Build meaningful solutions for pressing global problems'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Win Prizes',
      description: 'Compete for exciting prizes and real-world recognition'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Network',
      description: 'Network with innovators, mentors, and recruiters'
    }
  ]

  return (
    <Layout>
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold text-yellow-400 mb-6">
              <Rocket className="inline-block w-16 h-16 mr-4" />
              Hack to the Future
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 font-medium mb-8">
              "Code today, change tomorrow."
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-lg mb-8">
              <span className="bg-red-600 px-6 py-3 rounded-full font-bold text-white">
                First-ever Kratos 2k25 Hackathon
              </span>
              <span className="text-yellow-400 font-semibold text-xl">October 9th</span>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Get ready to innovate, build, and shape the future. Hack to the Future is a thrilling 12-hour hackathon 
              bringing together the brightest minds to tackle real-world challenges with creativity and technology!
            </p>
          </motion.div>
        </section>

        {/* Duration Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-8 bg-gradient-to-r from-red-600 to-purple-600 rounded-2xl"
          >
            <Clock className="w-16 h-16 mx-auto mb-4 text-white" />
            <h2 className="text-4xl font-bold text-white mb-2">
              <Clock className="inline-block w-8 h-8 mr-2" />
              Duration
            </h2>
            <p className="text-3xl font-bold text-yellow-300 mb-2">12 Hours</p>
            <p className="text-lg text-white">Non-stop coding, building, and problem-solving.</p>
          </motion.div>
        </section>

        {/* Problem Statement Tracks */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold text-yellow-400 text-center mb-12"
          >
            <Target className="inline-block w-10 h-10 mr-2" />
            Problem Statement Tracks
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tracks.map((track, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-gray-900/30 border border-red-500/20 rounded-xl backdrop-blur-sm hover:border-red-500/40 transition-all duration-300"
              >
                <div className="text-red-500 mb-4 flex justify-center">
                  {track.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{track.title}</h3>
                <p className="text-gray-300">{track.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold text-yellow-400 text-center mb-12"
          >
            <Code className="inline-block w-10 h-10 mr-2" />
            How It Works
          </motion.h2>
          <div className="text-center p-8 bg-gray-900/30 border border-red-500/20 rounded-xl backdrop-blur-sm">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-xl text-white">
              <Monitor className="inline-block w-6 h-6 mr-2" />
              Hackathon powered by <span className="font-bold text-yellow-400">Devfolio</span> for seamless participation and submissions.
            </p>
          </div>
        </section>

        {/* Prizes */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold text-yellow-400 text-center mb-12"
          >
            <Trophy className="inline-block w-10 h-10 mr-2" />
            Prizes & Perks
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-xl text-center"
            >
              <Trophy className="w-16 h-16 mx-auto mb-4 text-white" />
              <h3 className="text-2xl font-bold text-white mb-2">
                <Award className="inline-block w-6 h-6 mr-2" />
                First Prize
              </h3>
              <p className="text-yellow-100">[Add Actual Amount/Details Soon]</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-gray-500 to-gray-600 p-6 rounded-xl text-center"
            >
              <Trophy className="w-16 h-16 mx-auto mb-4 text-white" />
              <h3 className="text-2xl font-bold text-white mb-2">
                <Award className="inline-block w-6 h-6 mr-2" />
                Second Prize
              </h3>
              <p className="text-gray-200">[Add Amount/Details]</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-red-500 to-orange-600 p-6 rounded-xl text-center"
            >
              <Trophy className="w-16 h-16 mx-auto mb-4 text-white" />
              <h3 className="text-2xl font-bold text-white mb-2">
                <Award className="inline-block w-6 h-6 mr-2" />
                Third Prize
              </h3>
              <p className="text-orange-200">[Add Amount/Details]</p>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-6 bg-gray-900/30 border border-red-500/20 rounded-xl backdrop-blur-sm"
          >
            <Gift className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-2xl font-bold text-white mb-2">
              <Gift className="inline-block w-6 h-6 mr-2" />
              Special Tracks & Goodies
            </h3>
            <p className="text-lg text-gray-300">Swags, exclusive certificates, and unique opportunities await!</p>
          </motion.div>
        </section>

        {/* Why Participate */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold text-yellow-400 text-center mb-12"
          >
            <Star className="inline-block w-10 h-10 mr-2" />
            Why Participate?
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyParticipate.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-gray-900/30 border border-red-500/20 rounded-xl backdrop-blur-sm hover:border-red-500/40 transition-all duration-300"
              >
                <div className="text-red-500 mb-4 flex justify-center">
                  {reason.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{reason.title}</h3>
                <p className="text-gray-300">{reason.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Event Details */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold text-yellow-400 text-center mb-12"
          >
            <Calendar className="inline-block w-10 h-10 mr-2" />
            Event Details
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gray-900/30 border border-red-500/20 rounded-xl backdrop-blur-sm">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-bold text-white mb-2">Date</h3>
              <p className="text-gray-300">October 9th</p>
            </div>
            
            <div className="text-center p-6 bg-gray-900/30 border border-red-500/20 rounded-xl backdrop-blur-sm">
              <Clock className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-bold text-white mb-2">Duration</h3>
              <p className="text-gray-300">12 Hours</p>
            </div>
            
            <div className="text-center p-6 bg-gray-900/30 border border-red-500/20 rounded-xl backdrop-blur-sm">
              <Monitor className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-bold text-white mb-2">Mode</h3>
              <p className="text-gray-300">On Devfolio</p>
            </div>
            
            <div className="text-center p-6 bg-gray-900/30 border border-red-500/20 rounded-xl backdrop-blur-sm">
              <Users className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-bold text-white mb-2">Registration</h3>
              <p className="text-gray-300">Coming Soon!</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-600 to-purple-600 p-8 rounded-2xl"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              <Star className="inline-block w-10 h-10 mr-2" />
              Special Note
            </h2>
            <p className="text-xl text-white mb-8">
              This is the <span className="font-bold text-yellow-300">first ever hackathon</span> hosted by the Kratos Symposium. 
              Don't miss your chance to make history!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-lg text-xl transition-colors"
              onClick={() => {
                alert('Registration link coming soon!')
              }}
            >
              <Rocket className="inline-block w-6 h-6 mr-2" />
              Register Now & Make History!
            </motion.button>
          </motion.div>
        </section>
      </div>
    </Layout>
  )
}
