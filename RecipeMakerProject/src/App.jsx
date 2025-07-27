import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import RecipePage from './pages/RecipePage'
import RecipeGuide from './components/RecipeGuide'
import CommunityFeed from './pages/CommunityFeed'
import LoginPage from './pages/LoginPage'
// import VideoCallMock from './components/VideoCallMock'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
     <div className="w-screen h-screen flex justify-center items-center bg-black">
        <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-[#FF742C]"></div>
          </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen w-full">
        {user && <Navbar />}
        <Routes>
          <Route
            path="/"
            element={user ? <RecipePage /> : <Navigate to="/login" replace />}
          />
          <Route element={<LoginPage />} path='/login'></Route>
         <Route element={<RecipeGuide />} path='/recipes' > </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route element={<CommunityFeed />} path='/community' > </Route>
          {/* <Route element={<VideoCallMock />} path='/cook-together' > </Route> */}
        </Routes>
      </div>
    </Router>
  )
}

export default App
