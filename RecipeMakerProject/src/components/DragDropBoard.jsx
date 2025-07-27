// src/components/DragDropBoard.jsx
import { useState, useEffect, createContext } from 'react'
import { v4 as uuid } from 'uuid'
import Column from './PrepColumn'

export const BoardContext = createContext(null)

const COLUMN_KEYS = ['toPrep', 'cooking', 'completed']

const initialData = {
  toPrep: [
    { id: uuid(), text: 'Chop onions' },
    { id: uuid(), text: 'Peel garlic' },
  ],
  cooking: [],
  completed: [],
}

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

  return (
    <BoardContext.Provider value={{ addCard, activeColumn, setActiveColumn }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5">
        {COLUMN_KEYS.map(col => (
          <div key={col} className=" bg-gradient-to-br from-[#161825] via-[#1d1f31] to-[#161825] p-4 rounded-lg shadow-2xl flex flex-col">
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
          </div>
        ))}
      </div>
      {children}
    </BoardContext.Provider>
  )
}

function formatTitle(key) {
  if (key === 'toPrep') return 'To Prep'
  if (key === 'completed') return 'Done'
  return key.charAt(0).toUpperCase() + key.slice(1)
}
