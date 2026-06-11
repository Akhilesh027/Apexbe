import React, { useState } from "react";
import { Button } from "./ui/button";

const FormModal = ({ open, onClose, title, endpoint }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://api.apexbee.in/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Form submitted successfully!");
        setFormData({ name: "", email: "", phone: "", message: "" });
        onClose();
      } else {
        alert("Error submitting form");
      }
    } catch (error) {
      console.error(error);
      alert("Server error!");
    }
  };

  if (!open) return null;
return (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
    <div className="bg-white/20 backdrop-blur-xl p-8 rounded-3xl w-[420px] shadow-2xl border border-white/30 relative animate-fadeIn scale-100">
      
      <h2 className="text-3xl font-extrabold mb-6 text-white text-center drop-shadow-lg tracking-wide">
        {title}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full Name"
          required
          className="w-full bg-white/10 text-white placeholder-gray-200 border border-white/30 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition"
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email Address"
          required
          className="w-full bg-white/10 text-white placeholder-gray-200 border border-white/30 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition"
        />

        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          required
          className="w-full bg-white/10 text-white placeholder-gray-200 border border-white/30 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition"
        />

        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Your Message"
          rows={4}
          className="w-full bg-white/10 text-white placeholder-gray-200 border border-white/30 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition"
        />

        <div className="flex justify-end gap-3 mt-3">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gray-300/30 hover:bg-gray-300/50 text-white px-5 py-2 rounded-xl font-semibold transition"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-xl transition shadow-lg"
          >
            Submit
          </Button>
        </div>
      </form>

      <button
        className="absolute top-4 right-4 text-white hover:text-red-300 text-2xl font-bold transition"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  </div>
);

};

export default FormModal;
