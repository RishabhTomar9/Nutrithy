// src/components/user/profilePage/ProfileInfo.jsx

import { MapPin, Globe, Tag, Clock, ChefHat, AlertCircle } from "lucide-react";
import { FaUtensils } from "react-icons/fa";
import { motion } from "framer-motion";

export default function ProfileInfo({
  editMode,
  editForm,
  handleInputChange,
  profile,
  currentUser,
  userId,
}) {
  const infoVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4 },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-10 p-6 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl"
    >
      <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3 mb-6">
        Profile Information
      </h2>

      {editMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <motion.div variants={infoVariants} initial="hidden" animate="visible" custom={0}>
            <label className="text-sm text-gray-400 block mb-1">Location</label>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF742C]"
              />
              <input
                type="text"
                name="location"
                value={editForm.location}
                onChange={handleInputChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white focus:ring-1 focus:ring-[#FF742C]"
                placeholder="Your location"
              />
            </div>
          </motion.div>

          {/* Website */}
          <motion.div variants={infoVariants} initial="hidden" animate="visible" custom={1}>
            <label className="text-sm text-gray-400 block mb-1">Website</label>
            <div className="relative">
              <Globe
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF742C]"
              />
              <input
                type="url"
                name="website"
                value={editForm.website}
                onChange={handleInputChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white focus:ring-1 focus:ring-[#FF742C]"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </motion.div>

          {/* Interests */}
          <motion.div variants={infoVariants} initial="hidden" animate="visible" custom={2}>
            <label className="text-sm text-gray-400 block mb-1">Interests</label>
            <div className="relative">
              <Tag
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF742C]"
              />
              <input
                type="text"
                name="interests"
                value={editForm.interests}
                onChange={handleInputChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white focus:ring-1 focus:ring-[#FF742C]"
                placeholder="cooking, baking, healthy eating"
              />
            </div>
          </motion.div>

          {/* Dietary Preferences */}
          <motion.div variants={infoVariants} initial="hidden" animate="visible" custom={3}>
            <label className="text-sm text-gray-400 block mb-1">Dietary Preferences</label>
            <div className="relative">
              <FaUtensils
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF742C]"
              />
              <input
                type="text"
                name="dietaryPreferences"
                value={editForm.dietaryPreferences}
                onChange={handleInputChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white focus:ring-1 focus:ring-[#FF742C]"
                placeholder="vegetarian, vegan, keto"
              />
            </div>
          </motion.div>

          {/* Allergies */}
          <motion.div variants={infoVariants} initial="hidden" animate="visible" custom={4}>
            <label className="text-sm text-gray-400 block mb-1">Allergies</label>
            <div className="relative">
              <AlertCircle
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF742C]"
              />
              <input
                type="text"
                name="allergies"
                value={editForm.allergies}
                onChange={handleInputChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white focus:ring-1 focus:ring-[#FF742C]"
                placeholder="nuts, dairy, gluten"
              />
            </div>
          </motion.div>

          {/* Cooking Experience */}
          <motion.div variants={infoVariants} initial="hidden" animate="visible" custom={5}>
            <label className="text-sm text-gray-400 block mb-1">Cooking Experience</label>
            <div className="relative">
              <ChefHat
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF742C]"
              />
              <select
                name="cookingExperience"
                value={editForm.cookingExperience}
                onChange={handleInputChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white focus:ring-1 focus:ring-[#FF742C]"
              >
                <option value="">Select your experience</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {[
            {
              icon: <MapPin size={18} className="text-[#FF742C]" />,
              label: "Location",
              value: !userId ? currentUser?.location : profile?.location,
            },
            {
              icon: <Globe size={18} className="text-[#FF742C]" />,
              label: "Website",
              value: !userId ? currentUser?.website : profile?.website,
              isLink: true,
            },
            {
              icon: <ChefHat size={18} className="text-[#FF742C]" />,
              label: "Cooking Experience",
              value: !userId
                ? currentUser?.cookingExperience
                : profile?.cookingExperience,
            },
            {
              icon: <Clock size={18} className="text-[#FF742C]" />,
              label: "Joined",
              value: new Date(
                !userId ? currentUser?.joinedDate : profile?.joinedDate
              ).toLocaleDateString(),
            },
          ]
            .filter((item) => item.value)
            .map((item, i) => (
              <motion.div
                key={i}
                variants={infoVariants}
                className="flex items-start gap-3"
              >
                <div className="p-2 bg-[#FF742C]/10 rounded-lg">{item.icon}</div>
                <div>
                  <p className="text-sm text-gray-400">{item.label}</p>
                  {item.isLink ? (
                    <a
                      href={item.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-[#FF742C] transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-white capitalize">{item.value}</p>
                  )}
                </div>
              </motion.div>
            ))}
        </motion.div>
      )}
    </motion.div>
  );
}
