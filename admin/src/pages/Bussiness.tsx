import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const Businesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Fetch businesses from backend
  const fetchBusinesses = async () => {
    try {
      const res = await axios.get("https://api.apexbee.in/api/admin/businesses");
      setBusinesses(res.data.businesses);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch businesses");
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-500 text-white",
      approved: "bg-green-500 text-white",
      rejected: "bg-red-500 text-white",
      blocked: "bg-gray-700 text-white",
    };
    return (
      <Badge className={`px-2 py-1 rounded ${colors[status] || "bg-blue-500 text-white"}`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Update business status
  const updateStatus = async (businessId, status) => {
    try {
      await axios.put(`https://api.apexbee.in/api/admin/business/${businessId}/status`, { status });

      // Update frontend state
      setBusinesses((prev) =>
        prev.map((b) => (b._id === businessId ? { ...b, status } : b))
      );

      toast.success(`Business ${status} successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Businesses</h1>

      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="w-full table-auto">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="p-3 text-left">Business Name</th>
              <th className="p-3 text-left">Owner</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr key={b._id} className="border-b hover:bg-gray-50">
                <td className="p-3">{b.businessName}</td>
                <td className="p-3">{b.vendorId?.name || "N/A"}</td>
                <td className="p-3">{b.email}</td>
                <td className="p-3">{b.phone}</td>
                <td className="p-3">{getStatusBadge(b.status)}</td>
                <td className="p-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedBusiness(b)}>
                    View
                  </Button>
                  {b.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-500 text-white hover:bg-green-600"
                        onClick={() => updateStatus(b._id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => updateStatus(b._id, "rejected")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Business Modal */}
      <Dialog open={!!selectedBusiness} onOpenChange={() => setSelectedBusiness(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Business Details</DialogTitle>
          </DialogHeader>

          {selectedBusiness && (
            <div className="space-y-2 mt-2">
              {selectedBusiness.logo && (
                <img
                  src={selectedBusiness.logo}
                  alt="Logo"
                  className="w-32 h-32 object-cover rounded-md"
                />
              )}
              <p><b>Business Name:</b> {selectedBusiness.businessName}</p>
              <p><b>Owner:</b> {selectedBusiness.vendorId?.name || "N/A"}</p>
              <p><b>Email:</b> {selectedBusiness.email}</p>
              <p><b>Phone:</b> {selectedBusiness.phone}</p>
              <p><b>Business Types:</b> {selectedBusiness.businessTypes?.join(", ")}</p>
              <p><b>Industry Type:</b> {selectedBusiness.industryType}</p>
              <p><b>Registration Type:</b> {selectedBusiness.registrationType}</p>
              <p><b>Address:</b> {selectedBusiness.address}</p>
              <p><b>City:</b> {selectedBusiness.city}</p>
              <p><b>State:</b> {selectedBusiness.state}</p>
              <p><b>Pin Code:</b> {selectedBusiness.pinCode}</p>
              <p><b>GST Applicable:</b> {selectedBusiness.gstApplicable ? "Yes" : "No"}</p>
              {selectedBusiness.gstNumber && <p><b>GST Number:</b> {selectedBusiness.gstNumber}</p>}
              <p><b>Status:</b> {selectedBusiness.status.toUpperCase()}</p>
              <p><b>Created At:</b> {new Date(selectedBusiness.createdAt).toLocaleString()}</p>
              <p><b>Updated At:</b> {new Date(selectedBusiness.updatedAt).toLocaleString()}</p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedBusiness(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Businesses;
