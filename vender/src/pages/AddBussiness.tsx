import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import AppLayout from "@/components/AppLayout";

const AddBussiness = () => {
  const [step, setStep] = useState(1);

  // Step-1 States
  const [logo, setLogo] = useState<File | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [industryType, setIndustryType] = useState("");
  const [registrationType, setRegistrationType] = useState("");

  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [showCellOtp, setShowCellOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);

  // Step-2 States
  const [address, setAddress] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [gstApplicable, setGstApplicable] = useState(false);
  const [gstNumber, setGstNumber] = useState("");

  // Toggle Multi Select
  const toggleBusinessType = (type: string) => {
    setBusinessTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // Logo Upload
  const handleLogoUpload = (e: any) => {
    setLogo(e.target.files[0]);
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    try {
      const vendorId = localStorage.getItem("vendorId");

      if (!vendorId) {
        alert("Vendor ID missing. Please login again.");
        return;
      }

      const formData = new FormData();
      formData.append("vendorId", vendorId);

      // STEP 1
      formData.append("businessName", businessName);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("industryType", industryType);
      formData.append("registrationType", registrationType);
      formData.append("businessTypes", JSON.stringify(businessTypes));

      if (logo) formData.append("logo", logo);

      // STEP 2
      formData.append("address", address);
      formData.append("state", stateName);
      formData.append("city", city);
      formData.append("pinCode", pinCode);
      formData.append("gstApplicable", gstApplicable.toString());
      formData.append("gstNumber", gstNumber);

      const res = await axios.post(
        "http://localhost:5000/api/business/add-business",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Business Details Saved Successfully!");
      console.log(res.data);

    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving business details");
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-xl font-bold mb-6">
            Manage Business — Step {step}
          </h1>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

                {/* Logo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-40 h-40 bg-gray-200 rounded-xl flex flex-col items-center justify-center border border-gray-400 cursor-pointer hover:bg-gray-300"
                    onClick={() => document.getElementById("logoInput")?.click()}
                  >
                    <Upload className="w-10 h-10 text-gray-700" />
                    <span className="font-semibold mt-2 text-gray-700">
                      Upload Logo
                    </span>
                  </div>

                  <input
                    id="logoInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />

                  <div className="w-full">
                    <Label className="font-semibold">Business Name *</Label>
                    <Input
                      className="mt-1"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone + Email */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <Label className="font-semibold">Company Phone *</Label>
                    <Input
                      type="tel"
                      className="mt-1"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />

                    <Button
                      onClick={() => setShowCellOtp(true)}
                      className="mt-3 w-full bg-blue-600 text-white"
                    >
                      Send OTP
                    </Button>

                    {showCellOtp && (
                      <div className="mt-3">
                        <Label className="font-semibold">Enter OTP</Label>
                        <Input className="mt-1" />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="font-semibold">Company Email *</Label>
                    <Input
                      type="email"
                      className="mt-1"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />

                    <Button
                      onClick={() => setShowEmailOtp(true)}
                      className="mt-3 w-full bg-blue-600 text-white"
                    >
                      Send OTP
                    </Button>

                    {showEmailOtp && (
                      <div className="mt-3">
                        <Label className="font-semibold">Enter OTP</Label>
                        <Input className="mt-1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Type + Industry + Registration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Business Type */}
                <div>
                  <Label className="font-semibold">Business Type *</Label>

                  <Popover>
                    <PopoverTrigger className="w-full">
                      <div className="mt-1 flex justify-between items-center border rounded-lg px-3 py-2 cursor-pointer">
                        <span>
                          {businessTypes.length > 0
                            ? businessTypes.join(", ")
                            : "Select Business Type"}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </PopoverTrigger>

                    <PopoverContent className="w-56 p-3">
                      {[
                        "Retailer",
                        "Wholesaler",
                        "Distributor",
                        "Manufacturer",
                        "Services",
                      ].map((type) => (
                        <div
                          key={type}
                          className="flex items-center space-x-2 py-1"
                        >
                          <Checkbox
                            checked={businessTypes.includes(type)}
                            onCheckedChange={() => toggleBusinessType(type)}
                          />
                          <span className="text-sm">{type}</span>
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Industry Type */}
                <div>
                  <Label className="font-semibold">Industry Type *</Label>
                  <Select onValueChange={setIndustryType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Registration Type */}
                <div>
                  <Label className="font-semibold">Registration Type *</Label>
                  <Select onValueChange={setRegistrationType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Registration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private Limited</SelectItem>
                      <SelectItem value="public">Public Limited</SelectItem>
                      <SelectItem value="partnership">Partnership Firm</SelectItem>
                      <SelectItem value="llp">LLP</SelectItem>
                      <SelectItem value="opc">OPC</SelectItem>
                      <SelectItem value="sole">Sole Proprietorship</SelectItem>
                      <SelectItem value="unregistered">Unregistered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="mt-10 w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Continue to Step 2
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Business Address</h2>

              <div>
                <Label>Address</Label>
                <Input
                  className="mt-1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>State</Label>
                  <Input
                    className="mt-1"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>City</Label>
                  <Input
                    className="mt-1"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <Label>PIN Code</Label>
                  <Input
                    className="mt-1"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                  />
                </div>
              </div>

              {/* GST */}
              <div>
                <Label className="font-semibold">GST Applicable?</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <Button
                    type="button"
                    variant={gstApplicable ? "default" : "outline"}
                    onClick={() => setGstApplicable(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!gstApplicable ? "default" : "outline"}
                    onClick={() => setGstApplicable(false)}
                  >
                    No
                  </Button>
                </div>

                {gstApplicable && (
                  <div className="mt-4">
                    <Label>GST Number</Label>
                    <Input
                      className="mt-1"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  onClick={() => setStep(1)}
                  className="bg-gray-400 text-white"
                >
                  Back
                </Button>

                <Button
                  onClick={handleFinalSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Business Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AddBussiness;
