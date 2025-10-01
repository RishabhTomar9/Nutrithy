import React, { useState, useRef, useEffect } from 'react'
import { MdEdit, MdDelete, MdAdd, MdCheck } from 'react-icons/md'
import { FiArrowRight } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'

export default function PrepColumn({
  id,
  title,
  tasks,
  onAdd,
  onEdit,
  onDelete,
  moveTask,
}) {
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(null)

  const inputRef = useRef(null)

  // Handle submit for adding or editing tasks
  const handleSubmit = () => {
    if (!input.trim()) return
    if (editing) {
      onEdit(id, editing.id, input)
      setEditing(null)
    } else {
      onAdd(id, input)
    }
    setInput('')
  }

  // Highlight input when editing a task
  useEffect(() => {
    if (editing && inputRef.current) {
      gsap.fromTo(
        inputRef.current,
        { borderColor: 'rgba(59, 130, 246, 0.5)' },
        { borderColor: 'rgba(59, 130, 246, 1)', duration: 0.5, repeat: -1, yoyo: true }
      )
    }
    return () => {
      if (inputRef.current) {
        gsap.killTweensOf(inputRef.current)
      }
    }
  }, [editing])

  return (
    <motion.div
      id={id}
      className="flex flex-col text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Input field for adding/editing tasks */}
      <div className="flex mb-4 space-x-2">
        <motion.div className="relative flex-1">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={editing ? 'Edit task...' : 'Add new task...'}
            className="w-full px-4 py-2 rounded-lg bg-gray-800/70 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 text-white placeholder-gray-500"
          />
          {input.trim().length > 0 && (
            <motion.button
              onClick={handleSubmit}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-400 p-1 rounded-full hover:bg-green-500/10 transition-colors"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {editing ? <MdCheck size={20} /> : <MdAdd size={20} />}
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Task list */}
      <div className="space-y-3 prepScroll overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-gray-500 italic border border-dashed border-gray-700 rounded-lg"
            >
              No tasks yet
            </motion.div>
          ) : (
            tasks.map((task, index) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg shadow-md border border-gray-700 hover:border-gray-600 flex justify-between items-center group"
              >
                <motion.span
                  className="text-sm text-white font-medium flex-1 truncate mr-2"
                  whileHover={{ x: 3 }}
                >
                  {task.text}
                </motion.span>
                <div className="flex space-x-1 items-center">
                  {/* Edit */}
                  <motion.button
                    onClick={() => {
                      setEditing(task)
                      setInput(task.text)
                    }}
                    aria-label="Edit"
                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-full transition-colors cursor-pointer"
                  >
                    <MdEdit size={20} />
                  </motion.button>

                  {/* Delete */}
                  <motion.button
                    onClick={() => onDelete(task.id)}
                    aria-label="Delete"
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
                  >
                    <MdDelete size={20} />
                  </motion.button>

                  {/* Move to next column */}
                  {id === 'toPrep' && (
                    <motion.button
                      onClick={() => moveTask('toPrep', 'cooking', task.id)}
                      className="ml-1 flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md cursor-pointer"
                    >
                      Cook <FiArrowRight size={14} />
                    </motion.button>
                  )}
                  {id === 'cooking' && (
                    <motion.button
                      onClick={() => moveTask('cooking', 'completed', task.id)}
                      className="ml-1 flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md cursor-pointer"
                    >
                      Done <FiArrowRight size={14} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px; /* slim scrollbar */
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; /* subtle track */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2); /* light thumb */
          border-radius: 4px; /* rounded corners */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.35); /* subtle hover effect */
        }
        
        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
      `}</style>

    </motion.div>
  )
}
