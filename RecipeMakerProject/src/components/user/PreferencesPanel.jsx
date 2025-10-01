import { useState } from "react"
import { motion } from "framer-motion"
import { Settings, Bell, Save, Palette } from "lucide-react"

export default function PreferencesPanel() {
  // Notification Preferences
  const [notifications, setNotifications] = useState({
    "Recipe Recommendations": true,
    "New Features": true,
    "Health Tips": false,
    "Weekly Summary": false,
  })

  const toggleNotification = (item) => {
    setNotifications((prev) => ({ ...prev, [item]: !prev[item] }))
  }

  // Theme + Appearance
  const [theme, setTheme] = useState("Dark")
  const [color, setColor] = useState("#6366f1")
  const [fontSize, setFontSize] = useState(2)

  const savePreferences = () => {
    const prefs = { notifications, theme, color, fontSize }
    console.log("✅ Saved Preferences:", prefs)
    alert("Preferences saved successfully!")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-blue-500/20 rounded-full blur-3xl"></div>

      {/* Title */}
      <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <Settings className="text-indigo-400" size={24} /> Preferences
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Preferences */}
        <div className="bg-white/5 rounded-xl p-5">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={18} className="text-indigo-400" /> Notifications
          </h4>

          {Object.keys(notifications).map((item) => (
            <div
              key={item}
              className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
            >
              <span className="text-white">{item}</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={notifications[item]}
                  onChange={() => toggleNotification(item)}
                />
                <span className="w-11 h-6 bg-white/20 rounded-full shadow-inner relative transition-all">
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-transform ${
                      notifications[item]
                        ? "translate-x-5 bg-indigo-500"
                        : "bg-white"
                    }`}
                  ></span>
                </span>
              </label>
            </div>
          ))}

          <motion.button
            onClick={savePreferences}
            className="w-full mt-5 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30"
          >
            <Save size={16} /> Save Preferences
          </motion.button>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white/5 rounded-xl p-5">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette size={18} className="text-blue-400" /> Appearance
          </h4>

          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <p className="text-white mb-2">Theme</p>
              <div className="grid grid-cols-3 gap-3">
                {["System", "Light", "Dark"].map((t) => (
                  <motion.div
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-3 rounded-xl text-center cursor-pointer transition-all duration-300 ease-out flex flex-col items-center gap-2 hover:shadow-md ${
                      theme === t
                        ? "bg-indigo-500 text-white shadow-md border border-indigo-400"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:border hover:border-white/30"
                    }`}
                  >
                    {t}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Color Scheme */}
            <div>
              <p className="text-white mb-2">Color Scheme</p>
              <div className="flex gap-3">
                {["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#3b82f6"].map(
                  (c) => (
                    <div
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-300 ease-out ${
                        color === c
                          ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800 shadow-md shadow-white/20"
                          : "hover:ring-1 hover:ring-white/50 hover:shadow-sm hover:shadow-white/10"
                      }`}
                      style={{ backgroundColor: c }}
                    ></div>
                  )
                )}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="text-white">Font Size</p>
                <p className="text-white/70">
                  {fontSize === 1
                    ? "Small"
                    : fontSize === 2
                    ? "Medium"
                    : "Large"}
                </p>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>Small</span>
                <span>Medium</span>
                <span>Large</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
