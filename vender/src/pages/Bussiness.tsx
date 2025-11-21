import { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BusinessDetails = () => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const vendorId = localStorage.getItem("vendorId");
  const navigate = useNavigate();

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    const fetchBusiness = async () => {
      try {
        const res = await axios.get(
          `https://api.apexbee.in/api/business/get-business/${vendorId}`
        );
        setBusiness(res.data.business || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [vendorId]);

  // Loading
  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin h-10 w-10 text-gray-600" />
        </div>
      </AppLayout>
    );
  }

  // If NO business found → show Add Business prompt
  if (!business) {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col justify-center items-center text-gray-700">
          <p className="text-lg mb-4">No Business Details Found</p>

          <Button onClick={() => navigate("/add-business")} className="px-6 py-2 text-lg">
            Add Business
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Business Exists → Show details
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-10">
        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-6">

            {/* Logo */}
            <div className="flex justify-center">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt="Business Logo"
                  className="w-32 h-32 object-cover rounded-xl border"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-xl flex justify-center items-center text-gray-500">
                  No Logo
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700">Business Name</h3>
                <p className="text-gray-900">{business.businessName}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700">Phone</h3>
                <p className="text-gray-900">{business.phone}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700">Email</h3>
                <p className="text-gray-900">{business.email}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700">Industry Type</h3>
                <p className="text-gray-900">{business.industryType}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700">
                  Registration Type
                </h3>
                <p className="text-gray-900">{business.registrationType}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700">Business Types</h3>
                <p className="text-gray-900">
                  {business.businessTypes?.join(", ")}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-bold">Business Address</h3>

              <p className="mt-2 text-gray-800">
                {business.address}, {business.city}, {business.state} -{" "}
                {business.pinCode}
              </p>
            </div>

            {/* GST */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-bold">GST Details</h3>

              <p className="text-gray-800 mt-2">
                GST Applicable:{" "}
                <span className="font-semibold">
                  {business.gstApplicable ? "Yes" : "No"}
                </span>
              </p>

              {business.gstApplicable && (
                <p className="text-gray-800 mt-2">
                  GST Number:{" "}
                  <span className="font-semibold">{business.gstNumber}</span>
                </p>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default BusinessDetails;