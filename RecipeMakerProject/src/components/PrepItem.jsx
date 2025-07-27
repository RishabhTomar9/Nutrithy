import { useDraggable } from '@dnd-kit/core'

export default function PrepItem({ id }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id })
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded text-sm text-gray-800 dark:text-white shadow hover:shadow-md transition"
    >
      {id}
    </div>
  )
}
