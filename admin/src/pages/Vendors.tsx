import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://api.apexbee.in"; // adjust to your backend URL

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("vendors");
  const [updating, setUpdating] = useState(null);

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/vendors`);
      const vendorList = res.data.vendors || [];

      // Fetch earnings for each vendor
      const vendorsWithEarnings = await Promise.all(
        vendorList.map(async (vendor) => {
          try {
            const earningsRes = await axios.get(
              `${API_BASE}/api/vendor/earnings/${vendor._id}`
            );
            return {
              ...vendor,
              earnings: earningsRes.data, // { totalEarned, pendingBalance, withdrawn, transactions }
            };
          } catch (err) {
            console.error(`Failed to fetch earnings for vendor ${vendor._id}`, err);
            return { ...vendor, earnings: { totalEarned: 0, pendingBalance: 0, withdrawn: 0 } };
          }
        })
      );
      setVendors(vendorsWithEarnings);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
    }
  };

  // Fetch withdrawal requests
  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/withdrawal-requests`);
      setWithdrawals(res.data);
    } catch (err) {
      console.error("Failed to fetch withdrawal requests", err);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchWithdrawals();
  }, []);

  // Update vendor status (approve/reject/block)
  const updateVendorStatus = async (vendorId, status) => {
    setUpdating(vendorId);
    try {
      await axios.put(`${API_BASE}/api/admin/vendor/${vendorId}/status`, { status });
      setVendors((prev) =>
        prev.map((v) => (v._id === vendorId ? { ...v, status } : v))
      );
    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setUpdating(null);
    }
  };

  // Approve withdrawal request
  const approveWithdrawal = async (requestId) => {
    setUpdating(requestId);
    try {
      await axios.put(`${API_BASE}/api/admin/withdrawal-requests/${requestId}/approve`);
      // Refresh both lists
      await fetchWithdrawals();
      await fetchVendors(); // update vendor earnings (pending balance decreased)
    } catch (err) {
      console.error("Approval failed", err);
    } finally {
      setUpdating(null);
    }
  };

  // Reject withdrawal request
  const rejectWithdrawal = async (requestId) => {
    setUpdating(requestId);
    try {
      await axios.put(`${API_BASE}/api/admin/withdrawal-requests/${requestId}/reject`);
      await fetchWithdrawals();
    } catch (err) {
      console.error("Rejection failed", err);
    } finally {
      setUpdating(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const classes = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    };
    return classes[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Vendor Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "vendors"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("vendors")}
        >
          Vendors
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "withdrawals"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("withdrawals")}
        >
          Withdrawal Requests
        </button>
      </div>

      {/* Vendors Tab */}
      {activeTab === "vendors" && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-gray-300 bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b">Name</th>
                <th className="px-4 py-2 border-b">Email</th>
                <th className="px-4 py-2 border-b">Phone</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Total Earned</th>
                <th className="px-4 py-2 border-b">Pending Balance</th>
                <th className="px-4 py-2 border-b">Withdrawn</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v._id} className="text-center">
                  <td className="px-4 py-2 border-b">{v.name}</td>
                  <td className="px-4 py-2 border-b">{v.email}</td>
                  <td className="px-4 py-2 border-b">{v.cell}</td>
                  <td className="px-4 py-2 border-b">
                    <span
                      className={`px-2 py-1 rounded font-semibold ${
                        v.status === "approved"
                          ? "bg-green-200 text-green-800"
                          : v.status === "pending"
                          ? "bg-yellow-200 text-yellow-800"
                          : v.status === "rejected"
                          ? "bg-red-200 text-red-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b font-semibold">
                    {formatCurrency(v.earnings?.totalEarned)}
                  </td>
                  <td className="px-4 py-2 border-b text-blue-600 font-semibold">
                    {formatCurrency(v.earnings?.pendingBalance)}
                  </td>
                  <td className="px-4 py-2 border-b text-gray-600">
                    {formatCurrency(v.earnings?.withdrawn)}
                  </td>
                  <td className="px-4 py-2 border-b flex justify-center gap-2">
                    {v.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateVendorStatus(v._id, "approved")}
                          disabled={updating === v._id}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateVendorStatus(v._id, "rejected")}
                          disabled={updating === v._id}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {v.status === "approved" && (
                      <button
                        onClick={() => updateVendorStatus(v._id, "blocked")}
                        disabled={updating === v._id}
                        className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 disabled:opacity-50"
                      >
                        Block
                      </button>
                    )}
                    {v.status === "blocked" && (
                      <button
                        onClick={() => updateVendorStatus(v._id, "approved")}
                        disabled={updating === v._id}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        Unblock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Withdrawal Requests Tab */}
      {activeTab === "withdrawals" && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-gray-300 bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b">Vendor</th>
                <th className="px-4 py-2 border-b">Amount</th>
                <th className="px-4 py-2 border-b">Payment Method</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Requested At</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((req) => (
                <tr key={req._id} className="text-center">
                  <td className="px-4 py-2 border-b">
                    {req.vendorId?.name || req.vendorId?._id || "N/A"}
                  </td>
                  <td className="px-4 py-2 border-b font-semibold">
                    {formatCurrency(req.amount)}
                  </td>
                  <td className="px-4 py-2 border-b capitalize">{req.paymentMethod}</td>
                  <td className="px-4 py-2 border-b">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border-b flex justify-center gap-2">
                    {req.status === "pending" && (
                      <>
                        <button
                          onClick={() => approveWithdrawal(req._id)}
                          disabled={updating === req._id}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectWithdrawal(req._id)}
                          disabled={updating === req._id}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No withdrawal requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Vendors;