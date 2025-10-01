import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { FiMoreHorizontal } from 'react-icons/fi'

export default function PrepItem({ id }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id })
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 rounded-lg text-sm text-white shadow-lg border border-gray-600/30 hover:border-blue-500/30 transition-all duration-300"
      whileHover={{ scale: 1.03, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{id}</span>
        <motion.div 
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 hover:text-white"
        >
          <FiMoreHorizontal size={16} />
        </motion.div>
      </div>
      <div className="mt-1 w-full bg-gray-600/30 h-1 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  )
}
