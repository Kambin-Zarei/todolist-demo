import { useState, useEffect, useRef, useCallback } from 'react'

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Read a book', done: false },
    { id: 2, text: 'Go for a walk', done: true },
    { id: 3, text: 'Write some code', done: false },
  ])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')

  // Undo delete state: { todo, index } | null
  const [deletedTodo, setDeletedTodo] = useState(null)
  const [toastProgress, setToastProgress] = useState(100)
  const toastTimerRef = useRef(null)
  const progressIntervalRef = useRef(null)
  const TOAST_DURATION = 5000

  const clearToast = useCallback(() => {
    setDeletedTodo(null)
    setToastProgress(100)
    clearTimeout(toastTimerRef.current)
    clearInterval(progressIntervalRef.current)
  }, [])

  const deleteTodo = (id) => {
    const index = todos.findIndex((t) => t.id === id)
    const todo = todos[index]
    setTodos((prev) => prev.filter((t) => t.id !== id))

    clearTimeout(toastTimerRef.current)
    clearInterval(progressIntervalRef.current)

    setDeletedTodo({ todo, index })
    setToastProgress(100)

    const start = Date.now()
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      setToastProgress(Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100))
    }, 50)

    toastTimerRef.current = setTimeout(clearToast, TOAST_DURATION)
  }

  const undoDelete = useCallback(() => {
    if (!deletedTodo) return
    const { todo, index } = deletedTodo
    setTodos((prev) => {
      const next = [...prev]
      next.splice(index, 0, todo)
      return next
    })
    clearToast()
  }, [deletedTodo, clearToast])

  // Cmd/Ctrl+Z while toast is visible
  useEffect(() => {
    if (!deletedTodo) return
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        undoDelete()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deletedTodo, undoDelete])

  useEffect(() => () => {
    clearTimeout(toastTimerRef.current)
    clearInterval(progressIntervalRef.current)
  }, [])

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos([...todos, { id: Date.now(), text, done: false }])
    setInput('')
  }

  const toggleTodo = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const visible = todos.filter((t) =>
    filter === 'active' ? !t.done : filter === 'completed' ? t.done : true,
  )

  const remaining = todos.filter((t) => !t.done).length

  const tabClass = (name) =>
    `px-3 py-1 rounded-md text-sm font-medium transition ${
      filter === name
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-200'
    }`

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-16 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Todo List</h1>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs doing?"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addTodo}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition"
          >
            Add
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={tabClass(f)}
              aria-pressed={filter === f}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {visible.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50"
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`flex-1 text-left ${
                  todo.done ? 'line-through text-slate-400' : 'text-slate-800'
                }`}
                aria-label={`${todo.done ? 'Mark incomplete' : 'Mark complete'}: ${todo.text}`}
              >
                {todo.text}
              </button>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-slate-400 hover:text-red-500 text-lg font-bold px-2 transition-colors"
                aria-label={`Delete "${todo.text}"`}
              >
                ×
              </button>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="text-center text-slate-400 py-4 text-sm">
              Nothing here.
            </li>
          )}
        </ul>

        <div className="mt-4 text-sm text-slate-500">
          {filter !== 'all'
            ? `${visible.length} of ${todos.length}`
            : `${remaining} ${remaining === 1 ? 'item' : 'items'} left`}
        </div>
      </div>

      {/* Undo toast — aria-live region always mounted so screen readers catch announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        {deletedTodo && (
          <div className="relative overflow-hidden bg-slate-800 text-white rounded-lg shadow-xl min-w-64">
            {/* Countdown progress bar */}
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-indigo-400"
              style={{ width: `${toastProgress}%`, transition: 'width 50ms linear' }}
              aria-hidden="true"
            />
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-sm flex-1">
                <span className="text-slate-400">Deleted </span>
                <span className="font-medium">"{deletedTodo.todo.text}"</span>
              </span>
              <button
                onClick={undoDelete}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1"
              >
                Undo
              </button>
              <button
                onClick={clearToast}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
