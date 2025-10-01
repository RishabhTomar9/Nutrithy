import React, { useState } from "react";

export default function DeleteConfirmForm({ onCancel, onConfirm }) {
  const [value, setValue] = useState("");
  const canConfirm = value.trim().toUpperCase() === "DELETE";
  return (
    <div className="flex flex-col gap-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type DELETE to confirm"
        className="w-full rounded-xl px-3 py-2 bg-white text-black border border-gray-300"
      />
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/90 text-black hover:bg-white">Cancel</button>
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className={`px-4 py-2 rounded-lg ${canConfirm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-300 text-white/70 cursor-not-allowed'}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
