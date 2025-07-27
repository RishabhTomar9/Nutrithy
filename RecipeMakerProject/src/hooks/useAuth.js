import { useEffect, useState } from 'react'
import { auth, provider } from '../firebase'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)

      if (firebaseUser) {
        // ✅ Send user info to backend on login
        try {
          await fetch('http://localhost:5000/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            }),
          })
        } catch (err) {
          console.error('❌ Failed to sync user with backend:', err)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async () => {
    try {
      await signInWithPopup(auth, provider)
      // No need to manually set user here — `onAuthStateChanged` handles it
    } catch (error) {
      console.error('❌ Login failed:', error)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error('❌ Logout failed:', error)
    }
  }

  return { user, login, logout, loading }
}
