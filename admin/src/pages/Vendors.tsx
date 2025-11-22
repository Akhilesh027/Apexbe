import { useEffect, useState } from "react";
import axios from "axios";

const Vendors = () => {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    axios.get("https://api.apexbee.in/api/admin/vendors")
      .then(res => setVendors(res.data.vendors))
      .catch(err => console.error(err));
  }, []);

  const updateStatus = (vendorId, status) => {
    axios.put(`https://api.apexbee.in/api/admin/vendor/${vendorId}/status`, { status })
      .then(res => {
        setVendors(prev => prev.map(v => v._id === vendorId ? { ...v, status } : v));
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Vendors</h1>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Email</th>
              <th className="px-4 py-2 border-b">Phone</th>
              <th className="px-4 py-2 border-b">Status</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v._id} className="text-center">
                <td className="px-4 py-2 border-b">{v.name}</td>
                <td className="px-4 py-2 border-b">{v.email}</td>
                <td className="px-4 py-2 border-b">{v.cell}</td>
                <td className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded font-semibold ${
                    v.status === "approved" ? "bg-green-200 text-green-800" :
                    v.status === "pending" ? "bg-yellow-200 text-yellow-800" :
                    v.status === "rejected" ? "bg-red-200 text-red-800" :
                    "bg-gray-200 text-gray-800"
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-2 border-b flex justify-center gap-2">
                  {v.status === "pending" && (
                    <>
                      <button 
                        onClick={() => updateStatus(v._id, "approved")} 
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                        Approve
                      </button>
                      <button 
                        onClick={() => updateStatus(v._id, "rejected")} 
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                        Reject
                      </button>
                    </>
                  )}
                  {v.status === "approved" && (
                    <button 
                      onClick={() => updateStatus(v._id, "blocked")} 
                      className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800">
                      Block
                    </button>
                  )}
                  {v.status === "blocked" && (
                    <button 
                      onClick={() => updateStatus(v._id, "approved")} 
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                      Unblock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Vendors;
