import React, { useState } from 'react'
import { MdEdit, MdDelete } from 'react-icons/md'

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

  return (
    <div id={id} className="flex flex-col text-white">
      <h2 className="text-lg font-semibold mb-3 dark:text-white">{title}</h2>
      <div className="flex mb-4 space-x-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="New task..."
          className="flex-1 px-2 py-1 rounded border dark:bg-gray-800 dark:border-gray-600"
        />
        <button onClick={handleSubmit} className="px-3 py-1 bg-green-600 text-white rounded">
          {editing ? 'Update' : 'Add'}
        </button>
      </div>

      <div className="space-y-2 prepScroll overflow-y-auto h-45">
        {tasks.map(task => (
          <div
            key={task.id}
            className="bg-white dark:bg-gray-800 p-3 rounded shadow flex justify-between items-center"
          >
            <span className="text-sm dark:text-white">{(task.text).slice(0,15)}...</span>
            <div className="flex space-x-2 items-center text-gray-500">
              <button onClick={() => {
                setEditing(task)
                setInput(task.text)
              }} aria-label="Edit">
                <MdEdit />
              </button>
              <button onClick={() => onDelete(task.id)} aria-label="Delete">
                <MdDelete />
              </button>
              {id === 'toPrep' && (
                <button
                  onClick={() => moveTask('toPrep', 'cooking', task.id)}
                  className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded"
                >
                  ➤ Cook
                </button>
              )}
              {id === 'cooking' && (
                <button
                  onClick={() => moveTask('cooking', 'completed', task.id)}
                  className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded"
                >
                  ➤ Done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}