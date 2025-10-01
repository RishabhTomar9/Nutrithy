import React from "react";
import { motion } from "framer-motion";
import { UserCircle, Calendar, User, Droplet, Thermometer, Activity, Flame, Target, Edit3, Stethoscope } from "lucide-react";

function ProfileCard({ icon, label, value, onClick }) {
  return (
    <motion.div 
      className="bg-white/5 hover:bg-white/10 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-200 group"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-white/60 font-medium">{label}</div>
        <div className="text-sm sm:text-base lg:text-lg font-bold text-white truncate">{value}</div>
      </div>
    </motion.div>
  );
}

export default function PersonalInfo({ profile, setEditMode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-gray-800/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl lg:rounded-3xl border border-gray-700/50 shadow-xl relative overflow-hidden"
    >
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-green-500/10 rounded-full blur-3xl"></div>
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-white flex items-center gap-2 relative z-10">
        <UserCircle className="text-blue-400 flex-shrink-0" size={20} /> 
        <span className="truncate">Personal Information</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 relative z-10">
        <ProfileCard icon={<Calendar size={20} className="text-blue-400" />} label="Age" value={profile.age || "Not specified"} onClick={() => setEditMode(true)} />
        <ProfileCard icon={<User size={20} className="text-purple-400" />} label="Gender" value={profile.gender || "Not specified"} onClick={() => setEditMode(true)} />
        <ProfileCard icon={<Droplet size={20} className="text-red-400" />} label="Blood Group" value={profile.bloodGroup || "Not specified"} onClick={() => setEditMode(true)} />
        <ProfileCard icon={<Thermometer size={20} className="text-orange-400" />} label="Weight" value={profile.weight ? `${profile.weight} kg` : "Not specified"} onClick={() => setEditMode(true)} />
        <ProfileCard icon={<Activity size={20} className="text-green-400" />} label="Height" value={profile.height ? `${profile.height} cm` : "Not specified"} onClick={() => setEditMode(true)} />
        <ProfileCard icon={<Activity size={20} className="text-indigo-400" />} label="BMI" value={profile.bmi || "Not calculated"} onClick={() => setEditMode(true)} />
        <ProfileCard icon={<Flame size={20} className="text-yellow-400" />} label="Daily Calories" value={profile.dailyCalories ? `${profile.dailyCalories} kcal` : "Not calculated"} onClick={() => setEditMode(true)} />
        <ProfileCard icon={<Target size={20} className="text-pink-400" />} label="Goals" value={profile.goalStatus || "Not specified"} onClick={() => setEditMode(true)} />
      </div>
      <motion.div 
        className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-700/30 rounded-xl relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <h4 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2">
          <Stethoscope size={16} className="text-red-400 flex-shrink-0" /> 
          <span className="truncate">Medical History</span>
        </h4>
        <p className="text-white/80 text-sm sm:text-base p-3 bg-gray-800/30 rounded-lg leading-relaxed">
          {profile.medicalHistory || "No medical history provided. Click to add your medical information."}
        </p>
        <motion.button 
          onClick={() => setEditMode(true)}
          className="mt-3 sm:mt-4 py-2 px-3 sm:px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Edit3 size={14} /> 
          <span className="hidden sm:inline">Update Medical Info</span>
          <span className="sm:hidden">Update Info</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
