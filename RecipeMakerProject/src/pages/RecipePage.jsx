import { useContext, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import DragDropBoard, { BoardContext } from '../components/DragDropBoard'
import VoiceInput from '../components/VoiceInput'
import VideoCallMock from '../components/VideoCallMock'
import CookModeView from '../components/CookModeView'
import TagAnimator from '../components/TagAnimator'
import EmojiReactions from '../components/EmojiReactions'
import RecipeGuide from '../components/RecipeGuide'
import ThreadBackground from '../components/ThreadBackground'

export default function RecipePage() {
  const { user } = useAuth()

  return (
   <>
   <ThreadBackground />
    <div className="px-10 py-5 w-full mx-auto flex flex-col gap-6">
      <GreetingHeader user={user} />

      <DragDropBoard>
        <VoiceWithVideoSection />
      </DragDropBoard>


      {/* 👇 Pass callback to RecipeGuide to get selected steps */}
      {/* <RecipeGuide onRecipeSelect={setSelectedSteps} /> */}

      {/* 👇 Only show cook mode when steps are selected */}
      {/* {selectedSteps && <CookModeView steps={selectedSteps} />} */}
    </div>
   </>
  )
}

// ✨ Greeting with typing animation
function GreetingHeader({ user }) {
  const fullText = user?.displayName ? `, ${user.displayName}` : ''
  const [typedText, setTypedText] = useState('')

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1))
      i++
      if (i >= fullText.length) clearInterval(interval)
    }, 150)
    return () => clearInterval(interval)
  }, [fullText])

  return (
    <div className="text-center">
      <h1 className="lg:text-3xl text-lg lg:font-bold text-green-500 mt-25">
        Hello Chef{typedText} 👨‍🍳
      </h1>
      <p className="text-sm text-gray-400 mt-2">Ready to cook something delicious today?</p>
    </div>
  )
}

// ✅ Safe voice section inside DragDropBoard
function VoiceWithVideoSection() {
  const { addCard, activeColumn } = useContext(BoardContext)
  return (
    <div className="flex flex-col gap-4">
      <VoiceInput onVoiceAdd={(text) => addCard(activeColumn, text)} />
      <VideoCallMock />
    </div>
  )
}
