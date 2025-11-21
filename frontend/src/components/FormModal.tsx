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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl w-96 shadow-xl border border-blue-200 relative animate-fadeIn">
        <h2 className="text-2xl font-extrabold mb-4 text-blue-800 text-center">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="w-full border border-blue-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            required
            className="w-full border border-blue-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          />
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            required
            className="w-full border border-blue-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Your Message"
            className="w-full border border-blue-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          />

          <div className="flex justify-end gap-3 mt-3">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg transition"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg"
            >
              Submit
            </Button>
          </div>
        </form>

        {/* Optional close icon */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold text-lg"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default FormModal;
