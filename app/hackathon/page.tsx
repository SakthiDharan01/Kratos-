'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Code, Lightbulb, Trophy, ArrowRight, ExternalLink, Shield, Heart, Network, Brain } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'

export default function HackathonPage() {
  // Load Devfolio SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apply.devfolio.co/v2/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    
    return () => {
      // Only remove if it exists to avoid errors
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }
  }, []);
  const tracks = [
    {
      icon: <Network className="w-8 h-8" />,
      title: "Supply Chain Transparency",
      description: "Empowering farmers and consumers through a secure, traceable supply chain that ensures fair pay and informed choices.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Fake News and Deepfake Detection",
      description: "A multilingual AI tool to verify digital content and curb misinformation across cultures and platforms.",
      color: "from-red-500 to-pink-600"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Unified Digital Healthcare Bridge",
      description: "Tech-enabled rural health network that connects communities with rapid response teams and accessible care.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Deep Learning for Malware Detection",
      description: "An AI-driven malware scanner prototype showcasing how deep learning can revolutionize cybersecurity.",
      color: "from-purple-500 to-indigo-600"
    }
  ]

  const features = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: "12-Hour Sprint",
      description: "Non-stop coding, learning, and innovation for 12 exciting hours"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Collaboration",
      description: "Work with fellow developers and turn creativity into reality"
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "Build Prototypes",
      description: "Transform your ideas into real working prototypes"
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Innovation Focus",
      description: "Brainstorm, build, and bring your best ideas to life"
    }
  ]

  const timeline = [
    { time: "9:00 AM", event: "Registration & Welcome" },
    { time: "10:00 AM", event: "Opening Ceremony & Track Reveal" },
    { time: "11:00 AM", event: "Hacking Begins!" },
    { time: "1:00 PM", event: "Lunch Break" },
    { time: "3:00 PM", event: "Mid-Hackathon Check-in" },
    { time: "6:00 PM", event: "Dinner Break" },
    { time: "9:00 PM", event: "Final Push & Mentoring" },
    { time: "11:00 PM", event: "Final Submissions" },
    { time: "11:30 PM", event: "Judging & Awards Ceremony" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-white rounded-full animate-ping"></div>
          <div className="absolute bottom-32 left-40 w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="absolute top-60 left-1/2 w-1 h-1 bg-blue-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
        </div>

        <div className="container mx-auto px-6 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Main Logo */}
            <div className="mb-8">
              <Image 
                src="/hackathon/hack-the future.png" 
                alt="HACK TO THE FUTURE LOGO"
                width={700}
                height={220}
                className="mx-auto"
                priority
              />
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-blue-400 mb-6">
                12-Hour Hackathon
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-5xl mx-auto leading-relaxed mb-6">
                <span className="text-blue-400 font-semibold">Hack to the Future</span> is the flagship event of the 
                <span className="text-blue-400 font-semibold"> National Level Technical Symposium Kratos'25</span>, 
                hosted by the <span className="text-blue-400 font-semibold">Department of CSE, Easwari Engineering College</span>.
              </p>
              <p className="text-md md:text-lg text-gray-400 max-w-4xl mx-auto leading-relaxed">
                The hackathon is designed to <span className="text-blue-400">ignite innovation, creativity, and problem-solving skills</span> among students 
                by challenging them to build real-world solutions within 12 hours. With a strong focus on 
                <span className="text-blue-400"> industry relevance and societal impact</span>, this event brings together 
                the brightest young minds, mentors, and tech enthusiasts.
              </p>
            </motion.div>
          </motion.div>

          {/* Partner Logos */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 mb-16"
          >
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">Powered by</p>
              <Image 
                src="/hackathon/devfolio-logo.png" 
                alt="DEVFOLIO LOGO"
                width={200}
                height={60}
                className="mx-auto"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">In partnership with</p>
              <Image 
                src="/hackathon/ethindia-logo.png" 
                alt="ETHINDIA LOGO"
                width={240}
                height={70}
                className="mx-auto"
              />
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-center"
          >
            <div 
              className="apply-button mx-auto" 
              data-hackathon-slug="hacktothefuture" 
              data-button-theme="light"
              style={{ height: '44px', width: '312px' }}
            ></div>
            <p className="text-sm text-gray-400 mt-4">Register now to secure your spot!</p>
          </motion.div>
        </div>
      </section>

      {/* Tracks Section */}
      <section className="py-20 bg-black/40">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
              TRACKS
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Participants will innovate in the following domains
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {tracks.map((track, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className={`bg-gradient-to-br ${track.color} p-8 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 h-full transform group-hover:scale-[1.02]`}>
                  <div className="text-white mb-6 flex justify-center">
                    {track.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4 text-center">
                    {track.title}
                  </h3>
                  <p className="text-white/90 leading-relaxed text-center">
                    {track.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
              Why Join Us?
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              For 12 exciting hours, students will <span className="text-blue-400 font-semibold">brainstorm</span>, <span className="text-blue-400 font-semibold">build</span>, and <span className="text-blue-400 font-semibold">bring their ideas to life</span>, 
              turning creativity and collaboration into real working prototypes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-900/50 to-gray-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 text-center hover:border-blue-400/40 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-blue-400 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-black/30">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
              Event Timeline
            </h2>
            <p className="text-lg text-gray-300">Your 12-hour journey to innovation</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                className="flex items-center mb-8 relative"
              >
                {/* Timeline line */}
                {index < timeline.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-blue-400 to-transparent"></div>
                )}
                
                {/* Timeline dot */}
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-6 z-10 shadow-lg">
                  {index + 1}
                </div>
                
                {/* Content */}
                <div className="bg-gradient-to-r from-blue-900/30 to-gray-900/30 backdrop-blur-sm border border-blue-500/20 rounded-lg p-6 flex-1 hover:border-blue-400/40 transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-blue-400 font-bold text-lg">{item.time}</p>
                      <p className="text-white text-xl">{item.event}</p>
                    </div>
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/50 to-black/50">
        <div className="container mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">Hack the Future?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Join us for an unforgettable journey of innovation, collaboration, and building solutions that matter. 
              Be part of Kratos'25's flagship event!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <div 
                className="apply-button" 
                data-hackathon-slug="hacktothefuture" 
                data-button-theme="light"
                style={{ height: '44px', width: '312px' }}
              ></div>
              
              <Link 
                href="/"
                className="inline-flex items-center gap-2 border-2 border-blue-400 text-blue-400 font-bold py-4 px-8 rounded-lg hover:bg-blue-400 hover:text-black transition-all duration-300"
              >
                Back to Kratos'25
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="mt-8 text-sm text-gray-400">
              <p>Registration closes soon. Don't miss your chance to be part of history!</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-blue-500/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-8 mb-6">
              <Image 
                src="/hackathon/devfolio-logo.png" 
                alt="DEVFOLIO LOGO"
                width={140}
                height={35}
              />
              <Image 
                src="/hackathon/ethindia-logo.png" 
                alt="ETHINDIA LOGO"
                width={170}
                height={45}
              />
            </div>
            <h3 className="text-2xl font-bold text-blue-400 mb-2">Hack to the Future</h3>
            <p className="text-gray-400 mb-4">
              Flagship Event of Kratos'25 | Department of CSE, Easwari Engineering College
            </p>
            <p className="text-sm text-gray-500">
              © 2025 ACE - Association of Computer Engineers. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
