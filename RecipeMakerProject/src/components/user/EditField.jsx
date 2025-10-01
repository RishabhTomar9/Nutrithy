import React from "react";

export default function EditField({ label, name, value, onChange, type = "text", placeholder }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-white">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-xl px-3 py-2 bg-gray-200 text-black"
      />
    </div>
  );
}
