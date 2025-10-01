// src/components/DragDropBoard.jsx
import { useState, useEffect, createContext } from 'react'
import { v4 as uuid } from 'uuid'
import Column from './PrepColumn'
import { motion, AnimatePresence } from 'framer-motion'
import { GiChefToque } from 'react-icons/gi'
import { FiClock, FiCheckCircle } from 'react-icons/fi'

export const BoardContext = createContext(null)

const COLUMN_KEYS = ['toPrep', 'cooking', 'completed']

export default function DragDropBoard({ children }) {
  const [tasks, setTasks] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('recipe-board'))
    return COLUMN_KEYS.reduce((acc, key) => {
      acc[key] = stored?.[key] ?? []
      return acc
    }, {})
  })

  const [activeColumn, setActiveColumn] = useState('toPrep')

  useEffect(() => {
    localStorage.setItem('recipe-board', JSON.stringify(tasks))
  }, [tasks])

  const moveTask = (from, to, id) => {
    setTasks(prev => {
      const task = prev[from].find(t => t.id === id)
      return {
        ...prev,
        [from]: prev[from].filter(t => t.id !== id),
        [to]: [task, ...prev[to]],
      }
    })
  }

  const updateCard = (col, id, newText) => {
    setTasks(prev => ({
      ...prev,
      [col]: prev[col].map(t => (t.id === id ? { ...t, text: newText } : t)),
    }))
  }

  const deleteCard = (col, id) => {
    setTasks(prev => ({
      ...prev,
      [col]: prev[col].filter(t => t.id !== id),
    }))
  }

  const addCard = (col, text) => {
    const newCard = { id: uuid(), text }
    setTasks(prev => ({
      ...prev,
      [col]: [newCard, ...prev[col]],
    }))
  }

  // Column variants for animations
  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  // Get icon for each column
  const getColumnIcon = (col) => {
    switch(col) {
      case 'toPrep': return <GiChefToque className="text-yellow-400" />;
      case 'cooking': return <FiClock className="text-orange-400" />;
      case 'completed': return <FiCheckCircle className="text-green-400" />;
      default: return null;
    }
  };

  return (
    <BoardContext.Provider value={{ addCard, activeColumn, setActiveColumn }}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-5"
      >
        <AnimatePresence>
          {COLUMN_KEYS.map((col, i) => (
            <motion.div
              key={col}
              custom={i}
              variants={columnVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layoutId={`column-${col}`}
              className={`bg-gradient-to-br from-[#161825] via-[#1d1f31] to-[#161825] p-5 rounded-xl shadow-2xl flex flex-col border border-gray-800 ${col === activeColumn ? 'ring-2 ring-blue-500/30' : ''}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {getColumnIcon(col)}
                <motion.h3 
                  className="text-lg font-semibold text-white"
                  layoutId={`title-${col}`}
                >
                  {formatTitle(col)}
                </motion.h3>
                <motion.div 
                  className="ml-auto bg-gray-800 rounded-full px-3 py-0.8 text-lg text-white/90"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.3 + 0.2 }}
                >
                  {tasks[col]?.length || 0}
                </motion.div>
              </div>
              
              <Column
                id={col}
                title={formatTitle(col)}
                tasks={tasks[col] || []}
                isActive={col === activeColumn}
                onFocus={() => setActiveColumn(col)}
                onEdit={updateCard}
                onDelete={(id) => deleteCard(col, id)}
                onAdd={addCard}
                moveTask={moveTask}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {children}
    </BoardContext.Provider>
  )
}

function formatTitle(key) {
  if (key === 'toPrep') return 'To Prep'
  if (key === 'completed') return 'Done'
  return key.charAt(0).toUpperCase() + key.slice(1)
}
