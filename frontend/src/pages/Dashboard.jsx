import { useContext, useEffect, useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'

import DragDropBoard, { BoardContext } from '../components/diet/DragDropBoard'
import VoiceInput from '../components/common/VoiceInput'
import ThreadBackground from '../components/common/ThreadBackground'
import VideoCallMock from '../components/common/VideoCallMock'
import DietPlanner from '../components/diet/DietPlanner'
import TagAnimator from '../components/common/TagAnimator'
import EmojiReactions from '../components/community/EmojiReactions'
import HealthDataDisplay from '../components/health/HealthDataDisplay'
import DevicePairingModal from '../components/health/DevicePairingModal'

import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { FiClock, FiHeart } from 'react-icons/fi'
import { GiChefToque } from 'react-icons/gi'
import { Activity, Smartphone, Watch } from 'lucide-react'

// 🔹 StatsCard
function StatsCard({ icon, title, value, color }) {
  return (
    <motion.div 
      className={`bg-gradient-to-br ${color} p-4 rounded-xl shadow-lg text-white flex items-center gap-4`}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="bg-white/20 p-3 rounded-lg">{icon}</div>
      <div>
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </motion.div>
  )
}

// 🔹 GreetingHeader
function GreetingHeader({ user }) {
  const fullText = user?.displayName ? `, ${user.displayName}` : ''
  const [typedText, setTypedText] = useState('')
  const headerRef = useRef(null)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1))
      i++
      if (i >= fullText.length) clearInterval(interval)
    }, 150)
    return () => clearInterval(interval)
  }, [fullText])

  useEffect(() => {
    gsap.fromTo(
      ".chef-emoji",
      { y: -10, rotate: -5 },
      { y: 5, rotate: 5, duration: 1.5, repeat: -1, yoyo: true, ease: "elastic.out(1, 0.3)" }
    )
  }, [])

  return (
    <motion.div 
      ref={headerRef}
      className="text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="lg:text-4xl text-2xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-emerald-600 text-transparent bg-clip-text"
        whileHover={{ scale: 1.05 }}
      >
        Hello Chef{typedText} <span className="chef-emoji"> 👨‍🍳</span>
      </motion.h1>
      <motion.p 
        className="text-md text-gray-300 mt-3 italic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
       Ready to cook something delicious today? 🍳 Let’s make your meals fun and healthy!
      </motion.p>
    </motion.div>
  )
}

// 🔹 Voice + Video Section
function VoiceWithVideoSection() {
  const { addCard, activeColumn } = useContext(BoardContext)
  return (
    <motion.div className="flex flex-col gap-6">
      <VoiceInput onVoiceAdd={(text) => addCard(activeColumn, text)} />
      <motion.div className="rounded-xl overflow-hidden shadow-lg">
        <VideoCallMock />
      </motion.div>
    </motion.div>
  )
}

// 🔹 Main Page
export default function Dashboard() {
  const { user } = useAuth()
  const pageRef = useRef(null)
  const [showDevicePairing, setShowDevicePairing] = useState(false)

  useEffect(() => {
    gsap.fromTo(
      pageRef.current.children,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "power2.out" }
    )
  }, [])

  return (
    <>
      <motion.div 
        ref={pageRef}
        className="px-10 pt-8 w-full mx-auto flex flex-col gap-8 max-w-7xl"
      >
        <GreetingHeader user={user} />

        {/* Recipe Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <StatsCard icon={<GiChefToque size={24} />} title="Recipes Created" value="12" color="from-blue-500 to-indigo-600" />
          <StatsCard icon={<FiClock size={24} />} title="Cooking Time" value="3.5 hrs" color="from-amber-500 to-orange-600" />
          <StatsCard icon={<FiHeart size={24} />} title="Favorite Recipes" value="5" color="from-rose-500 to-pink-600" />
        </div>

        {/* Health Metrics Quick Overview */}
        <motion.div 
          className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <HealthDataDisplay showConnectionButtons={true} onConnect={() => setShowDevicePairing(true)} />
        </motion.div>

        {/* Drag + Voice + Video */}
        <DragDropBoard>
          <VoiceWithVideoSection />
        </DragDropBoard>

        {/* AI Diet Planner */}
        <div>
          {/* <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-green-400">AI</span> Diet Planner
            <TagAnimator tags={["Smart", "Personalized", "Nutritious"]} />
          </h2> */}
          <div>
            <DietPlanner />
          </div>
        </div>

        {/* Emoji Reactions */}
        {/* <div className="mt-6 flex justify-center">
          <EmojiReactions />
        </div> */}
      </motion.div>

      {/* Device Pairing Modal */}
      <DevicePairingModal 
        isVisible={showDevicePairing}
        onClose={() => setShowDevicePairing(false)}
        onSuccess={(deviceType) => {
          console.log(`${deviceType} connected successfully`);
          setShowDevicePairing(false);
        }}
      />
    </>
  )
}
