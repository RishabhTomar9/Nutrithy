import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FcGoogle } from 'react-icons/fc'
import { motion } from 'framer-motion'
import ThreadBackground from '../components/common/ThreadBackground'
import axiosInstance from '../utils/axiosInstance'

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [checkingProfile, setCheckingProfile] = useState(false)

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return

      setCheckingProfile(true)
      try {
        const { data } = await axiosInstance.get('/api/users/me')
        if (data.user && data.user.profileCompleted) {
          navigate('/', { replace: true })
        } else {
          navigate('/register-profile', { replace: true })
        }
      } catch (err) {
        console.error('Error checking profile:', err)
        navigate('/register-profile', { replace: true })
      } finally {
        setCheckingProfile(false)
      }
    }

    if (!loading && user) checkProfile()
  }, [user, loading, navigate])

  if (loading || checkingProfile) {
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-black">
        <p className="text-white text-lg">Checking profile...</p>
      </div>
    )
  }

  return (
    <>
      <ThreadBackground />
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md md:max-w-lg p-6 sm:p-8 bg-gradient-to-br from-[#0c0d14] via-[#1d1f31] to-[#0c0d14] rounded-2xl text-center space-y-6 shadow-2xl"
        >
          {/* Logo */}
          <div className="flex justify-center">
            <motion.svg
              viewBox="0 0 180 60"
              width="220"
              height="60"
              initial={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 6, delay: 0.3 }}
            >
              <text
                x="0"
                y="45"
                fontSize="32"
                className="sm:font-bold"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              >
                Nutrithy 🍳
              </text>
            </motion.svg>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-gray-400 text-xs sm:text-sm md:text-base whitespace-nowrap overflow-hidden border-r-2 border-gray-400 animate-typing"
          >
            Your intelligent cooking assistant.
          </motion.p>

          {/* Google Sign-In */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              try {
                const data = await login()
                if (data?.profileCompleted) navigate('/', { replace: true })
                else navigate('/register-profile', { replace: true })
              } catch (e) {
                console.error('Login error', e)
              }
            }}
            className="flex items-center justify-center w-full gap-3 px-4 py-3 sm:px-6 rounded-lg border border-gray-600 bg-white dark:bg-gray-700 hover:shadow-lg transition cursor-pointer"
          >
            <FcGoogle className="text-xl sm:text-2xl" />
            <span className="text-xs sm:text-sm md:text-base font-medium text-gray-800 dark:text-gray-100">
              Sign in with Google
            </span>
          </motion.button>

          <p className="text-xs sm:text-sm text-gray-500">Start your smart cooking journey.</p>
        </motion.div>
      </div>
    </>
  )
}
