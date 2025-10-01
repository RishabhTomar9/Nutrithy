import React, { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Calendar,
  Activity,
  Heart,
  ImageIcon,
} from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";

import gsap from "gsap";
import axiosInstance from "../utils/axiosInstance";

export default function RegisterProfile() {
  const auth = getAuth();
  const firebaseUser = auth.currentUser;
  const navigate = useNavigate();
  const formRef = useRef();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name: firebaseUser?.displayName || "",
    email: firebaseUser?.email || "",
    photo: firebaseUser?.photoURL || "",
    phone: "",
    dob: "",
    gender: "",
    weight: "",
    height: "",
    bloodGroup: "",
    medicalConditions: "",
    allergies: "",
    dailyCalories: "",
    goalStatus: "",
  });

  useEffect(() => {
    gsap.from(formRef.current, { });
    // If profile already exists, redirect to profile
    (async () => {
      try {
        const { data } = await axiosInstance.get("/api/users/me");
        if (data.profileCompleted) {
          navigate("/profile", { replace: true });
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      }
    })();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data } = await axiosInstance.post("/api/users/register", {
        name: form.name,
        email: form.email,
        photo: form.photo,
        dob: form.dob,
        phone: form.phone,
        gender: form.gender,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        bloodGroup: form.bloodGroup,
        medicalHistory: [form.medicalConditions, form.allergies].filter(Boolean).join(", "),
        dailyCalories: form.dailyCalories,
        goalStatus: form.goalStatus,
      });
      if (data && data.profileCompleted) {
        navigate("/profile", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Failed to register profile:", error);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-[80vw] flex items-center justify-center p-6 text-white py-15">
      <motion.div
        ref={formRef}
        className="rounded-3xl p-8 w-full max-w-5xl bg-gray-800 shadow-2xl"
      >
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          Complete Your Profile
        </h1>

        {errorMsg && (
          <div className="mb-4 text-red-400 text-center">{errorMsg}</div>
        )}

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          onSubmit={handleSubmit}
        >
        {/* Profile Photo Preview */}
        <motion.div
          className="md:col-span-2 flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {form.photo ? (
            <img
              src={form.photo}
              alt="Profile Preview"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-500 mb-3"
            />
          ) : (
            <FaUserCircle className="w-24 h-24 text-gray-500 mb-3" />
          )}
        </motion.div>
      
        {/* Name */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <InputField
            label="Name"
            icon={<User size={18} />}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            disabled
          />
        </motion.div>
      
        {/* Email */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <InputField
            label="Email"
            icon={<User size={18} />}
            name="email"
            value={form.email}
            disabled
          />
        </motion.div>
      
        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <InputField
            label="Phone"
            icon={<Phone size={18} />}
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </motion.div>
      
        {/* DOB */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <InputField
            label="Date of Birth"
            icon={<Calendar size={18} />}
            name="dob"
            value={form.dob}
            type="date"
            onChange={handleChange}
          />
        </motion.div>
      
        {/* Gender */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <SelectField
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            options={["Male", "Female", "Other"]}
          />
        </motion.div>
      
        {/* Weight */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <InputField
            label="Weight (kg)"
            icon={<Activity size={18} />}
            name="weight"
            value={form.weight}
            type="number"
            onChange={handleChange}
            placeholder="Your weight in kg"
          />
        </motion.div>
      
        {/* Height */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <InputField
            label="Height (cm)"
            icon={<Activity size={18} />}
            name="height"
            value={form.height}
            type="number"
            onChange={handleChange}
            placeholder="Your height in cm"
          />
        </motion.div>
      
        {/* Blood Group */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <SelectField
            label="Blood Group"
            name="bloodGroup"
            value={form.bloodGroup}
            onChange={handleChange}
            options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
          />
        </motion.div>
      
        {/* Medical Conditions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <InputField
            label="Medical Conditions"
            name="medicalConditions"
            value={form.medicalConditions}
            onChange={handleChange}
            placeholder="Comma separated"
          />
        </motion.div>
      
        {/* Allergies */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <InputField
            label="Allergies"
            name="allergies"
            value={form.allergies}
            onChange={handleChange}
            placeholder="Comma separated"
          />
        </motion.div>
      
        {/* Daily Calories */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <InputField
            label="Daily Calories"
            icon={<Heart size={18} />}
            name="dailyCalories"
            value={form.dailyCalories}
            type="number"
            onChange={handleChange}
            placeholder="Enter your daily target"
          />
        </motion.div>
      
        {/* Goal Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <InputField
            label="Goal Status"
            name="goalStatus"
            value={form.goalStatus}
            onChange={handleChange}
            placeholder="Your fitness goals"
            className="md:col-span-2"
          />
        </motion.div>
      
        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="md:col-span-2 mt-4 w-full py-3 bg-green-500 hover:bg-green-600 rounded-2xl text-black font-bold shadow-lg"
        >
          {loading ? "Saving..." : "Save Profile"}
        </motion.button>
      </form>

      </motion.div>
    </div>
  );
}

/* Reusable Input Component */
function InputField({
  label,
  icon,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  className = "",
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="flex items-center gap-2 mb-1 text-white">
        {icon && icon} {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`rounded-xl px-3 py-2 ${
          disabled ? "bg-gray-400 cursor-not-allowed" : "bg-gray-200"
        } text-black`}
      />
    </div>
  );
}

/* Reusable Select Component */
function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-white">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-xl px-3 py-2 bg-gray-200 text-black"
      >
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
