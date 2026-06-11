import { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BusinessDetails = () => {
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false); // Toggle edit mode
    const [formData, setFormData] = useState({}); // Form data state
    const [logoFile, setLogoFile] = useState(null); // State for new logo file upload
    const [isSaving, setIsSaving] = useState(false); // State for save button loading

    const vendorId = localStorage.getItem("vendorId");
    const navigate = useNavigate();

    // Fetch Business Details
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

                const biz = res.data.business || null;
                setBusiness(biz);

                // Initialize formData with fetched data
                if (biz) {
                    setFormData({
                        businessName: biz.businessName || "",
                        phone: biz.phone || "",
                        email: biz.email || "",
                        industryType: biz.industryType || "",
                        registrationType: biz.registrationType || "",
                        businessTypes: biz.businessTypes || [],
                        address: biz.address || "",
                        city: biz.city || "",
                        state: biz.state || "",
                        pinCode: biz.pinCode || "",
                        gstApplicable: biz.gstApplicable || false,
                        gstNumber: biz.gstNumber || "",
                        logoUrl: biz.logo || "", // Store current logo URL
                    });

                    // Save to localStorage
                    localStorage.setItem("businessName", biz.businessName || "");
                    localStorage.setItem("businessLogo", biz.logo || "");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBusiness();
    }, [vendorId]);

    // Form Handlers
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleBusinessTypesChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const currentTypes = prev.businessTypes || [];
            if (checked) {
                return { ...prev, businessTypes: [...currentTypes, value] };
            } else {
                return { ...prev, businessTypes: currentTypes.filter(type => type !== value) };
            }
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        setLogoFile(file);
    };

    // Edit Mode Toggles
    const handleEdit = () => setIsEditing(true);

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form data to the last saved business state
        if (business) {
            setFormData({
                businessName: business.businessName || "",
                phone: business.phone || "",
                email: business.email || "",
                industryType: business.industryType || "",
                registrationType: business.registrationType || "",
                businessTypes: business.businessTypes || [],
                address: business.address || "",
                city: business.city || "",
                state: business.state || "",
                pinCode: business.pinCode || "",
                gstApplicable: business.gstApplicable || false,
                gstNumber: business.gstNumber || "",
                logoUrl: business.logo || "",
            });
        }
        setLogoFile(null); // Clear any pending file selection
    };

    // API Update Logic
    const handleUpdateBusiness = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            // Special handling for array of strings (businessTypes)
            if (key === 'businessTypes' && Array.isArray(formData[key])) {
                data.append(key, JSON.stringify(formData[key]));
            } else if (key !== 'logoUrl') {
                // Exclude the logoUrl from the direct form data payload
                data.append(key, formData[key]);
            }
        });

        // Append the new logo file if one was selected
        if (logoFile) {
            data.append('logo', logoFile);
        }

        try {
            const res = await axios.patch(
                `https://api.apexbee.in/api/business/update-business/${vendorId}`,
                data,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            // Update local state with the newly saved data
            const updatedBiz = res.data.business;
            setBusiness(updatedBiz);
            setIsEditing(false);

            // Re-initialize formData with fresh data from server
            setFormData({
                businessName: updatedBiz.businessName || "",
                phone: updatedBiz.phone || "",
                email: updatedBiz.email || "",
                industryType: updatedBiz.industryType || "",
                registrationType: updatedBiz.registrationType || "",
                businessTypes: updatedBiz.businessTypes || [],
                address: updatedBiz.address || "",
                city: updatedBiz.city || "",
                state: updatedBiz.state || "",
                pinCode: updatedBiz.pinCode || "",
                gstApplicable: updatedBiz.gstApplicable || false,
                gstNumber: updatedBiz.gstNumber || "",
                logoUrl: updatedBiz.logo || "",
            });

            // Update localStorage
            localStorage.setItem("businessName", updatedBiz.businessName || "");
            localStorage.setItem("businessLogo", updatedBiz.logo || "");

            // Clear temporary file state
            setLogoFile(null);

            // Using alert() is generally discouraged in production apps, but keeping it consistent with the existing logic
            alert("Business details updated successfully!");

        } catch (err) {
            console.error("Update failed:", err.response?.data || err.message);
            alert(`Failed to update business: ${err.response?.data?.error || 'Server error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Helper functions for rendering
    const renderDetailField = (label, value) => (
        <div>
            <h3 className="font-semibold text-gray-700">{label}</h3>
            <p className="text-gray-900">{value}</p>
        </div>
    );

    const renderEditField = (label, name, type = 'text', options = []) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>{label}</label>
            {type === 'select' ? (
                <select
                    id={name}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Select {label}</option>
                    {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            ) : type === 'checkbox-group' ? (
                <div className="flex flex-wrap gap-4 mt-1">
                    {options.map(option => (
                        <label key={option} className="flex items-center space-x-2 text-gray-900">
                            <input
                                type="checkbox"
                                name={name}
                                value={option}
                                checked={formData[name]?.includes(option)}
                                onChange={handleBusinessTypesChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
            )}
        </div>
    );

    const commonIndustryOptions = ["Retail", "Service", "Manufacturing", "Tech", "Other"];
    const commonRegistrationOptions = ["Sole Proprietorship", "Partnership", "Private Ltd.", "Public Ltd."];
    const commonBusinessTypes = ["Online", "Physical Store", "Wholesale", "Export"];

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

                    <Button onClick={() => navigate("/add-business")} className="px-6 py-2 text-lg bg-blue-600 hover:bg-blue-700">
                        Add Business
                    </Button>
                </div>
            </AppLayout>
        );
    }

    // Business Exists → Show details or Edit Form
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto py-10">
                <Card className="shadow-lg">
                    <CardContent className="p-6 space-y-6">
                        {/* Header and Actions */}
                        <div className="flex justify-between items-center pb-4 border-b">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isEditing ? "Edit Business Details" : "Business Details"}
                            </h2>
                            {isEditing ? (
                                <div className="flex space-x-3">
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        disabled={isSaving}
                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpdateBusiness}
                                        disabled={isSaving}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleEdit}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>

                        {/* Form/Details Content */}
                        <form onSubmit={handleUpdateBusiness}>
                            {/* Logo */}
                            <div className="flex flex-col items-center gap-4 mb-8">
                                <div className="relative w-32 h-32">
                                    <img
                                        // Preview file if selected, otherwise show current business logo
                                        src={logoFile ? URL.createObjectURL(logoFile) : business.logo}
                                        alt="Business Logo"
                                        className="w-full h-full object-cover rounded-xl border-4 border-gray-200"
                                    />
                                </div>

                                {isEditing && (
                                    <input
                                        type="file"
                                        id="logo"
                                        name="logo"
                                        onChange={handleFileChange}
                                        className="block w-full max-w-sm text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                )}
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {isEditing ? (
                                    <>
                                        {renderEditField("Business Name", "businessName")}
                                        {renderEditField("Phone", "phone")}
                                        {renderEditField("Email", "email", "email")}
                                        {renderEditField("Industry Type", "industryType", "select", commonIndustryOptions)}
                                        {renderEditField("Registration Type", "registrationType", "select", commonRegistrationOptions)}
                                        {renderEditField("Business Types", "businessTypes", "checkbox-group", commonBusinessTypes)}
                                    </>
                                ) : (
                                    <>
                                        {renderDetailField("Business Name", business.businessName)}
                                        {renderDetailField("Phone", business.phone)}
                                        {renderDetailField("Email", business.email)}
                                        {renderDetailField("Industry Type", business.industryType)}
                                        {renderDetailField("Registration Type", business.registrationType)}
                                        {renderDetailField("Business Types", business.businessTypes?.join(", "))}
                                    </>
                                )}
                            </div>

                            {/* Address */}
                            <div className="pt-6 border-t mt-6 space-y-6">
                                <h3 className="text-lg font-bold">Business Address</h3>
                                {isEditing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {renderEditField("Address Line", "address")}
                                        {renderEditField("City", "city")}
                                        {renderEditField("State", "state")}
                                        {renderEditField("Pin Code", "pinCode")}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-gray-800">
                                        {business.address}, {business.city}, {business.state} -{" "}
                                        {business.pinCode}
                                    </p>
                                )}
                            </div>

                            {/* GST */}
                            <div className="pt-6 border-t mt-6 space-y-3">
                                <h3 className="text-lg font-bold">GST Details</h3>

                                <div className="flex items-center gap-4">
                                    <h4 className="font-semibold text-gray-700">GST Applicable:</h4>
                                    {isEditing ? (
                                        <label className="flex items-center space-x-2 text-gray-900">
                                            <input
                                                type="checkbox"
                                                name="gstApplicable"
                                                checked={formData.gstApplicable}
                                                onChange={handleChange}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            />
                                            <span className="font-semibold">
                                                {formData.gstApplicable ? "Yes" : "No"}
                                            </span>
                                        </label>
                                    ) : (
                                        <span className="font-semibold text-gray-900">
                                            {business.gstApplicable ? "Yes" : "No"}
                                        </span>
                                    )}
                                </div>

                                {(isEditing ? formData.gstApplicable : business.gstApplicable) && (
                                    isEditing ? (
                                        renderEditField("GST Number", "gstNumber")
                                    ) : (
                                        <p className="text-gray-800">
                                            GST Number:{" "}
                                            <span className="font-semibold">{business.gstNumber}</span>
                                        </p>
                                    )
                                )}
                            </div>

                            {/* Submit button for small screens */}
                            {isEditing && (
                                <div className="mt-8 md:hidden">
                                    <Button
                                        type="submit"
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Save Changes"}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default BusinessDetails;