import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function WeeklyActivity() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const generated = days.map((day) => ({
      day,
      value: Math.floor(Math.random() * 100) + 10,
    }));
    setData(generated);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-6 p-6 rounded-2xl shadow-xl border border-white/10 backdrop-blur-sm relative overflow-hidden"
    >

      <div className="h-64 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={36} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="#ffffff40" 
              tick={{ fontSize: 12, fill: '#ffffff90' }} 
              axisLine={{ stroke: '#ffffff20' }}
            />
            <YAxis 
              stroke="#ffffff40" 
              tick={{ fontSize: 12, fill: '#ffffff70' }} 
              axisLine={{ stroke: '#ffffff20' }}
              tickLine={{ stroke: '#ffffff20' }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              content={({ active, payload, label }) =>
                active && payload && payload.length ? (
                  <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 px-4 py-3 rounded-lg text-white text-sm shadow-xl border border-white/10 backdrop-blur-md">
                    <p className="font-medium text-white/80 mb-1">{label}</p>
                    <p className="text-lg font-bold text-emerald-400">{payload[0].value} <span className="text-xs text-white/60">activities</span></p>
                  </div>
                ) : null
              }
            />

            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill="url(#glowGradient)" 
                  className="hover:opacity-90 transition-opacity"
                >
                  <motion.rect
                    initial={{ height: 0, y: 200 }}
                    animate={{ height: entry.value * 2, y: 200 - entry.value * 2 }}
                    transition={{
                      delay: index * 0.1,
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                  />
                </Cell>
              ))}
            </Bar>

            <defs>
              <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399">
                  <animate
                    attributeName="stop-color"
                    values="#34d399; #10b981; #34d399"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-white/50">
        <div>Last updated: Today</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Activity Score
        </div>
      </div>

      <style>{`
        .recharts-bar-rectangle path {
          filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.6));
          transition: filter 0.3s ease, opacity 0.3s ease;
        }
        .recharts-bar-rectangle:hover path {
          filter: drop-shadow(0 0 18px rgba(16, 185, 129, 0.9));
          opacity: 0.9;
        }
      `}</style>
    </motion.div>
  );
}
