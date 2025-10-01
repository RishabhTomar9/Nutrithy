// src/components/user/profilePage/ProfileStats.jsx
import { BookOpen, Users, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfileStats({ profile, currentUser, userId }) {
  const stats = [
    {
      label: "Recipes",
      value: !userId && currentUser
        ? currentUser.recipes?.length || 0
        : profile?.recipes?.length || 0,
      icon: BookOpen,
    },
    {
      label: "Followers",
      value: !userId && currentUser
        ? currentUser.followers?.length || 0
        : profile?.followers?.length || 0,
      icon: Users,
    },
    {
      label: "Following",
      value: !userId && currentUser
        ? currentUser.following?.length || 0
        : profile?.following?.length || 0,
      icon: UserCheck,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-6 mt-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="text-center flex flex-col items-center bg-white/5 rounded-2xl p-6 shadow-md backdrop-blur-md border border-white/10"
          >
            <p className="text-4xl font-extrabold text-white drop-shadow-sm">
              {stat.value}
            </p>
            <div className="flex items-center gap-1 mt-1 text-gray-300 text-sm font-medium">
              <Icon size={16} className="text-[#FF742C]" />
              <span>{stat.label}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
