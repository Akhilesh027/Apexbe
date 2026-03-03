import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    User, Package, MapPin, Gift, Edit, ChevronRight, Loader2, X, Truck, CheckCircle, Clock, AlertCircle, CreditCard, Calendar, Save, Camera, Plus, Trash2, Copy, Share2, Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// NOTE: Assuming useToast and Footer are imported or mocked elsewhere in the actual project structure.
// import { useToast } from "@/hooks/use-toast";

// --- Referral Data Types ---
interface ReferralStats {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalEarnings: number;
    walletBalance: number;
}

interface ReferralHistory {
    _id: string;
    referredUser: {
        name: string;
        email: string;
    };
    status: 'pending' | 'completed' | 'credited';
    rewardAmount: number;
    createdAt: string;
}

// --- API Configuration ---
// NOTE: Use environment variable in production (e.g., import.meta.env.VITE_API_URL)
const API_BASE_URL = "https://api.apexbee.in"; 


const Profile = () => {
    const navigate = useNavigate();
    // const { toast } = useToast(); // Assuming toast hook is available, mocking if not
    const toast = (config) => console.log('Toast:', config.title, config.description); 
    
    const [activeTab, setActiveTab] = useState("profile");
    const [userData, setUserData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    
    // --- Referral States ---
    const [referralCode, setReferralCode] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [referralStats, setReferralStats] = useState<ReferralStats>({
        totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0,
        totalEarnings: 0, walletBalance: 0
    });
    const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
    const [referralLoaded, setReferralLoaded] = useState(false);
    // --- End Referral States ---
    
    const [loading, setLoading] = useState({
        user: true,
        orders: false,
        addresses: false,
        referrals: false, // NEW loading state for referrals
        saving: false
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [copyLoading, setCopyLoading] = useState(false); 

    const [editFormData, setEditFormData] = useState({
        name: "", email: "", phone: "", dateOfBirth: "", gender: "", bio: ""
    });
    const [addressFormData, setAddressFormData] = useState({
        name: "", phone: "", address: "", city: "", state: "", pincode: "", type: "home", isDefault: false
    });

    // --- Utility Function for Authenticated Fetching ---
    const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("User not authenticated.");
        }

        const headers: HeadersInit = {
            "Authorization": `Bearer ${token}`,
            ...options.headers
        };

        if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText || response.status}`);
        }
        return response.json();
    }, []);
    // --- End Utility Function ---


    // Get user data from localStorage (Initial Load)
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            const initialData = {
                _id: user.id,
                name: user.name || user.username,
                email: user.email,
                phone: user.phone || "+91 98765 43210",
                dateOfBirth: user.dateOfBirth || "",
                gender: user.gender || "",
                bio: user.bio || "",
                avatar: user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
            };
            setUserData(initialData);
            setEditFormData({
                name: initialData.name, email: initialData.email, phone: initialData.phone,
                dateOfBirth: initialData.dateOfBirth, gender: initialData.gender, bio: initialData.bio
            });
            setLoading(prev => ({ ...prev, user: false }));
        } else {
            setError("User not found. Please login again.");
            setLoading(prev => ({ ...prev, user: false }));
        }
    }, []);

    // --- Data Fetching Effects ---

    // Fetch orders when orders tab is active
    useEffect(() => {
        if (activeTab === "orders" && userData?._id && orders.length === 0) {
            fetchOrders();
        }
    }, [activeTab, userData]);

    // Fetch addresses when addresses tab is active
    useEffect(() => {
        if (activeTab === "addresses" && userData?._id) {
            fetchAddresses();
        }
    }, [activeTab, userData]);

    // Fetch referral data when referrals tab is active (NEW)
    useEffect(() => {
        if (activeTab === "referrals" && userData?._id && !referralLoaded) {
            fetchReferralData();
        }
    }, [activeTab, userData, referralLoaded]);


    // --- Core API Call Handlers ---

    const fetchOrders = async () => {
        setLoading(prev => ({ ...prev, orders: true }));
        try {
            const data = await authenticatedFetch(`/api/orders/user/${userData._id}`);
            setOrders(data.orders || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setError("Failed to load orders");
        } finally {
            setLoading(prev => ({ ...prev, orders: false }));
        }
    };

    const fetchAddresses = async () => {
        setLoading(prev => ({ ...prev, addresses: true }));
        try {
            const data = await authenticatedFetch(`/api/user/address/${userData._id}`);
            if (data.address) {
                setAddresses([data.address]);
            } else if (Array.isArray(data.addresses)) {
                setAddresses(data.addresses);
            } else {
                setAddresses([]);
            }
        } catch (error) {
            console.error("Error fetching addresses:", error);
            setError("Failed to load addresses");
        } finally {
            setLoading(prev => ({ ...prev, addresses: false }));
        }
    };

    // --- Referral Logic (INTEGRATED) ---

    const fetchReferralData = async () => {
        setLoading(prev => ({ ...prev, referrals: true }));
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                toast({ title: "Authentication required", description: "Please login to access referral features", variant: "destructive" });
                setLoading(prev => ({ ...prev, referrals: false }));
                return;
            }

            const [codeData, statsData, historyData] = await Promise.all([
                authenticatedFetch('/api/referrals/code'),
                authenticatedFetch('/api/referrals/stats'),
                authenticatedFetch('/api/referrals/history?limit=20')
            ]);

            setReferralCode(codeData.referralCode);
            setReferralLink(codeData.referralLink);
            setReferralStats(statsData);
            setReferralHistory(historyData.referrals || []);
            setReferralLoaded(true);

        } catch (error) {
            console.error('Error fetching referral data:', error);
            toast({ title: "Error", description: "Failed to load referral data. Please try again.", variant: "destructive" });
        } finally {
            setLoading(prev => ({ ...prev, referrals: false }));
        }
    };

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        setCopyLoading(true);
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copied!",
                description: type === 'code'
                    ? "Referral code copied to clipboard"
                    : "Referral link copied to clipboard",
            });
        } catch (error) {
            toast({ title: "Copy failed", description: "Failed to copy to clipboard", variant: "destructive" });
        } finally {
            setCopyLoading(false);
        }
    };

    const shareReferral = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join me on this amazing platform!',
                    text: `Use my referral code ${referralCode} to sign up and get benefits!`,
                    url: referralLink,
                });
                toast({ title: "Shared!", description: "Referral link shared successfully" });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            copyToClipboard(referralLink, 'link');
        }
    };
    
    const getReferralStatusColor = (status: string) => {
        switch (status) {
            case 'credited': return 'text-green-600';
            case 'completed': return 'text-blue-600';
            case 'pending': return 'text-orange-500';
            default: return 'text-gray-600';
        }
    };

    const getReferralStatusText = (status: string) => {
        switch (status) {
            case 'credited': return 'Credited';
            case 'completed': return 'Completed';
            case 'pending': return 'Pending Purchase';
            default: return status;
        }
    };

    const referralStatsCards = [
        { label: "Total Referrals", value: referralStats.totalReferrals.toString(), icon: Users, description: "Total friends invited" },
        { label: "Total Earnings", value: referralStats.totalEarnings, icon: Gift, description: "Amount earned from referrals" },
        { label: "Pending Rewards", value: referralStats.pendingReferrals.toString(), icon: Users, description: "Referrals awaiting reward" },
    ];
    // --- End Referral Logic ---

    // --- Profile Update Handlers ---

    const handleSaveProfile = async () => {
        setLoading(prev => ({ ...prev, saving: true }));
        setError("");
        setSuccess("");

        try {
            const updatedUser = await authenticatedFetch(`/api/user/profile/${userData._id}`, {
                method: "PUT",
                body: JSON.stringify(editFormData)
            });

            const currentUser = JSON.parse(localStorage.getItem("user"));
            const updatedUserData = {
                ...currentUser,
                name: updatedUser.name || editFormData.name, phone: updatedUser.phone || editFormData.phone,
                dateOfBirth: updatedUser.dateOfBirth || editFormData.dateOfBirth, gender: updatedUser.gender || editFormData.gender,
                bio: updatedUser.bio || editFormData.bio
            };

            localStorage.setItem("user", JSON.stringify(updatedUserData));
            setUserData(prev => ({ ...prev, ...editFormData }));

            setSuccess("Profile updated successfully!");
            setShowEditProfile(false);

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setError("Failed to update profile. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleInlineEdit = (field, value) => {
        setEditingField(field);
        setTempValue(value);
    };

    const handleInlineSave = async (field) => {
        if (tempValue === userData[field]) {
            setEditingField(null);
            return;
        }

        setLoading(prev => ({ ...prev, saving: true }));
        try {
            await authenticatedFetch(`/api/user/profile/${userData._id}`, {
                method: "PATCH",
                body: JSON.stringify({ [field]: tempValue })
            });

            const currentUser = JSON.parse(localStorage.getItem("user"));
            const updatedUserData = { ...currentUser, [field]: tempValue };
            localStorage.setItem("user", JSON.stringify(updatedUserData));

            setUserData(prev => ({ ...prev, [field]: tempValue }));
            setEditFormData(prev => ({ ...prev, [field]: tempValue }));
            setEditingField(null);
            setSuccess(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setError("Failed to update profile. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setTempValue("");
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError("Please select a valid image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size should be less than 5MB");
            return;
        }

        setLoading(prev => ({ ...prev, saving: true }));

        try {
            // NOTE: In a real app, upload file via FormData here and get the permanent URL back
            // Simulating update for UI:
            const imageUrl = URL.createObjectURL(file);

            const updatedUserData = { ...userData, avatar: imageUrl };
            setUserData(updatedUserData);

            const currentUser = JSON.parse(localStorage.getItem("user"));
            localStorage.setItem("user", JSON.stringify({ ...currentUser, avatar: imageUrl })); // Use server URL in real scenario

            setSuccess("Profile picture updated successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error updating avatar:", error);
            setError("Failed to update profile picture");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleAddAddress = () => {
        setAddressFormData({
            name: "", phone: "", address: "", city: "", state: "", pincode: "", type: "home", isDefault: addresses.length === 0
        });
        setEditingAddress(null);
        setShowAddAddress(true);
    };

    const handleEditAddress = (address) => {
        setAddressFormData({
            name: address.name || "", phone: address.phone || "", address: address.address || "",
            city: address.city || "", state: address.state || "", pincode: address.pincode || "",
            type: address.type || "home", isDefault: address.isDefault || false
        });
        setEditingAddress(address);
        setShowAddAddress(true);
    };

    const handleSaveAddress = async () => {
        setLoading(prev => ({ ...prev, saving: true }));
        setError("");

        try {
            const url = editingAddress
                ? `/api/user/address/${userData._id}/${editingAddress._id}`
                : `/api/user/address/${userData._id}`;

            await authenticatedFetch(url, {
                method: editingAddress ? "PUT" : "POST",
                body: JSON.stringify(addressFormData)
            });

            setSuccess(editingAddress ? "Address updated successfully!" : "Address added successfully!");
            setShowAddAddress(false);
            fetchAddresses();

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error saving address:", error);
            setError("Failed to save address. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!confirm("Are you sure you want to delete this address?")) {
            return;
        }

        setLoading(prev => ({ ...prev, saving: true }));
        try {
            await authenticatedFetch(`/api/user/address/${userData._id}/${addressId}`, {
                method: "DELETE",
            });

            setSuccess("Address deleted successfully!");
            fetchAddresses();

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error deleting address:", error);
            setError("Failed to delete address. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleSetDefaultAddress = async (addressId) => {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            await authenticatedFetch(`/api/user/address/${userData._id}/${addressId}/default`, {
                method: "PATCH",
            });

            setSuccess("Default address updated successfully!");
            fetchAddresses();

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error setting default address:", error);
            setError("Failed to set default address. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleViewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    // --- Formatting Utilities ---

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    const getOrderStatusBadge = (status) => {
        const statusConfig = {
            'pending': { variant: 'secondary', color: 'bg-yellow-500', label: 'Pending' },
            'confirmed': { variant: 'secondary', color: 'bg-blue-500', label: 'Confirmed' },
            'processing': { variant: 'secondary', color: 'bg-orange-500', label: 'Processing' },
            'shipped': { variant: 'secondary', color: 'bg-purple-500', label: 'Shipped' },
            'delivered': { variant: 'default', color: 'bg-green-500', label: 'Delivered' },
            'cancelled': { variant: 'secondary', color: 'bg-red-500', label: 'Cancelled' },
            'refunded': { variant: 'secondary', color: 'bg-gray-500', label: 'Refunded' }
        };

        const config = statusConfig[status] || { variant: 'secondary', color: 'bg-gray-500', label: status };
        return (<Badge variant={config.variant} className={config.color}>{config.label}</Badge>);
    };

    const getPaymentMethodLabel = (method) => {
        const methods = {
            'upi': 'UPI', 'card': 'Credit/Debit Card', 'netbanking': 'Net Banking',
            'scan': 'Scan & Pay', 'cod': 'Cash on Delivery'
        };
        return methods[method] || method;
    };

    // --- Loading and Error Screens ---

    if (loading.user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto py-8 px-4">
                    <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-navy" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !userData) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto py-8 px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        <p className="text-red-500">{error}</p>
                        <Button onClick={() => window.location.href = '/login'} className="mt-4">
                            Go to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Success/Error Messages */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700">{success}</p>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Profile Header */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-yellow">
                                        <AvatarImage src={userData?.avatar} />
                                        <AvatarFallback className="text-2xl">
                                            {userData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-navy text-white p-2 rounded-full cursor-pointer hover:bg-navy/90 transition-colors">
                                        <Camera className="h-4 w-4" />
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h1 className="text-3xl font-bold mb-2">{userData?.name}</h1>
                                    <p className="text-muted-foreground">{userData?.email}</p>
                                    <p className="text-muted-foreground">{userData?.phone}</p>
                                    {userData?.bio && (
                                        <p className="text-muted-foreground mt-2 italic">"{userData.bio}"</p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => setShowEditProfile(true)}
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit Profile
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                            <TabsTrigger value="profile" className="gap-2"> <User className="h-4 w-4" /> Profile </TabsTrigger>
                            <TabsTrigger value="orders" className="gap-2"> <Package className="h-4 w-4" /> My Orders </TabsTrigger>
                            <TabsTrigger value="addresses" className="gap-2"> <MapPin className="h-4 w-4" /> Addresses </TabsTrigger>
                            <TabsTrigger value="referrals" className="gap-2"> <Gift className="h-4 w-4" /> Referrals </TabsTrigger>
                        </TabsList>

                        {/* Profile Details Tab */}
                        <TabsContent value="profile">
                            <Card>
                                <CardHeader> <CardTitle>Personal Information</CardTitle> </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <div className="flex items-center gap-2">
                                                {editingField === 'name' ? (
                                                    <>
                                                        <Input id="name" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1" />
                                                        <Button size="sm" onClick={() => handleInlineSave('name')} disabled={loading.saving}>
                                                            {loading.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Input id="name" value={userData?.name || ''} readOnly className="flex-1" />
                                                        <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('name', userData?.name)}><Edit className="h-4 w-4" /></Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Email Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <div className="flex items-center gap-2">
                                                <Input id="email" type="email" value={userData?.email || ''} readOnly className="flex-1" />
                                                <Badge variant="secondary" className="cursor-not-allowed"> Cannot Edit </Badge>
                                            </div>
                                        </div>

                                        {/* Phone Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <div className="flex items-center gap-2">
                                                {editingField === 'phone' ? (
                                                    <>
                                                        <Input id="phone" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1" />
                                                        <Button size="sm" onClick={() => handleInlineSave('phone')} disabled={loading.saving}>
                                                            {loading.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Input id="phone" value={userData?.phone || ''} readOnly className="flex-1" />
                                                        <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('phone', userData?.phone)}><Edit className="h-4 w-4" /></Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Date of Birth Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                            <div className="flex items-center gap-2">
                                                {editingField === 'dateOfBirth' ? (
                                                    <>
                                                        <Input id="dateOfBirth" type="date" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1" />
                                                        <Button size="sm" onClick={() => handleInlineSave('dateOfBirth')} disabled={loading.saving}>
                                                            {loading.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Input id="dateOfBirth" type="text" value={formatDate(userData?.dateOfBirth)} readOnly className="flex-1" />
                                                        <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('dateOfBirth', userData?.dateOfBirth || '')}><Edit className="h-4 w-4" /></Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Gender Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="gender">Gender</Label>
                                            <div className="flex items-center gap-2">
                                                {editingField === 'gender' ? (
                                                    <>
                                                        <Select value={tempValue} onValueChange={setTempValue}>
                                                            <SelectTrigger className="flex-1"> <SelectValue placeholder="Select gender" /> </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="male">Male</SelectItem>
                                                                <SelectItem value="female">Female</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Button size="sm" onClick={() => handleInlineSave('gender')} disabled={loading.saving}>
                                                            {loading.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Input id="gender" value={userData?.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : "Not set"} readOnly className="flex-1" />
                                                        <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('gender', userData?.gender || '')}><Edit className="h-4 w-4" /></Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <div className="flex items-start gap-2">
                                            {editingField === 'bio' ? (
                                                <>
                                                    <Textarea id="bio" value={tempValue} onChange={(e) => setTempValue(e.target.value)} placeholder="Tell us a little about yourself..." className="flex-1 min-h-[100px]" />
                                                    <div className="flex flex-col gap-2">
                                                        <Button size="sm" onClick={() => handleInlineSave('bio')} disabled={loading.saving}>
                                                            {loading.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Textarea id="bio" value={userData?.bio || "No bio added yet..."} readOnly className="flex-1 min-h-[100px]" />
                                                    <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('bio', userData?.bio || '')}><Edit className="h-4 w-4" /></Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* My Orders Tab */}
                        <TabsContent value="orders">
                            <Card>
                                <CardHeader> <CardTitle>Order History</CardTitle> </CardHeader>
                                <CardContent>
                                    {loading.orders ? (
                                        <div className="flex justify-center items-center h-32"> <Loader2 className="h-6 w-6 animate-spin text-navy" /> </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No orders found</p>
                                            <Button onClick={() => navigate("/products")} className="mt-4 bg-navy hover:bg-navy/90"> Start Shopping </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.map((order) => (
                                                <div key={order._id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                    {order.orderItems?.[0]?.image && (
                                                        <div className="w-24 h-24 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                                                            <img src={`${API_BASE_URL}${order.orderItems[0].image}`} alt={order.orderItems[0].name} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                                                                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                                                            </div>
                                                            {getOrderStatusBadge(order.orderStatus?.currentStatus)}
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-sm text-muted-foreground"> {order.orderSummary?.itemsCount || order.orderItems?.length || 0} items </p>
                                                            <div className="flex items-center gap-4">
                                                                <p className="font-semibold text-lg"> {formatCurrency(order.orderSummary?.total || 0)} </p>
                                                                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleViewOrderDetails(order)}>
                                                                    View Details <ChevronRight className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* My Addresses Tab */}
                        <TabsContent value="addresses">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Saved Addresses</CardTitle>
                                        <Button className="bg-navy hover:bg-navy/90 gap-2" onClick={handleAddAddress}>
                                            <Plus className="h-4 w-4" /> Add New Address
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loading.addresses ? (
                                        <div className="flex justify-center items-center h-32"> <Loader2 className="h-6 w-6 animate-spin text-navy" /> </div>
                                    ) : addresses.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No addresses saved</p>
                                            <Button className="mt-4 bg-navy hover:bg-navy/90" onClick={handleAddAddress}> Add Your First Address </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {addresses.map((address) => (
                                                <div key={address._id || address.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline">{address.type || 'Address'}</Badge>
                                                            {address.isDefault && (<Badge className="bg-yellow text-navy">Default</Badge>)}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {!address.isDefault && (
                                                                <Button variant="ghost" size="sm" onClick={() => handleSetDefaultAddress(address._id || address.id)} disabled={loading.saving}> Set Default </Button>
                                                            )}
                                                            <Button variant="ghost" size="sm" onClick={() => handleEditAddress(address)}> <Edit className="h-4 w-4" /> </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(address._id || address.id)} disabled={loading.saving}> <Trash2 className="h-4 w-4" /> </Button>
                                                        </div>
                                                    </div>
                                                    <h3 className="font-semibold mb-1">{address.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{address.address}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {address.city}, {address.state} - {address.pincode}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-2">Phone: {address.phone}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Referrals Tab (UPDATED CODE) */}
                        <TabsContent value="referrals">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Refer & Earn Rewards</CardTitle>
                                </CardHeader>
                                
                                {loading.referrals ? (
                                    <CardContent>
                                        <div className="flex justify-center items-center min-h-64"> <Loader2 className="h-8 w-8 animate-spin text-navy" /> </div>
                                    </CardContent>
                                ) : (
                                    <CardContent className="space-y-8">
                                        {/* Hero Section */}
                                        <div className="bg-gradient-to-r from-navy to-yellow-600 rounded-xl p-8 text-white">
                                            <div className="text-center">
                                                <Gift className="h-16 w-16 mx-auto mb-4" />
                                                <h2 className="text-3xl font-bold mb-2">Earn {formatCurrency(50)} per Referral</h2>
                                                <p className="text-lg mb-6 opacity-90">Invite friends and earn rewards when they make their first purchase</p>
                                                <div className="bg-white/20 rounded-lg p-4 inline-block">
                                                    <p className="text-xl font-semibold">Wallet Balance: {formatCurrency(referralStats.walletBalance)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid md:grid-cols-3 gap-6">
                                            {referralStatsCards.map((stat) => {
                                                const Icon = stat.icon;
                                                return (
                                                    <div key={stat.label} className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-100">
                                                        <Icon className="h-8 w-8 mx-auto mb-3 text-yellow-600" />
                                                        <div className="text-3xl font-bold text-navy mb-1">{stat.value}</div>
                                                        <div className="text-sm font-medium text-navy mb-1">{stat.label}</div>
                                                        <div className="text-xs text-muted-foreground">{stat.description}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Referral Code & Link */}
                                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                            <h3 className="text-xl font-bold text-navy mb-4">Your Referral Code & Link</h3>
                                            
                                            {/* Referral Code */}
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-navy mb-2">Referral Code</label>
                                                <div className="flex gap-3">
                                                    <div className="flex-1 bg-blue-50 rounded-lg p-4 font-mono text-xl font-bold text-navy text-center border border-blue-200">
                                                        {referralCode || "Code N/A"}
                                                    </div>
                                                    <Button
                                                        onClick={() => copyToClipboard(referralCode, 'code')}
                                                        className="bg-navy hover:bg-navy/90 min-w-[100px]"
                                                        disabled={!referralCode || copyLoading}
                                                    >
                                                        {copyLoading ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<><Copy className="h-4 w-4 mr-2" />Copy</>)}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Referral Link */}
                                            <div>
                                                <label className="block text-sm font-medium text-navy mb-2">Referral Link</label>
                                                <div className="flex gap-3">
                                                    <div className="flex-1 bg-blue-50 rounded-lg p-3 text-sm text-navy break-all border border-blue-200 font-medium">
                                                        {referralLink || "Link N/A"}
                                                    </div>
                                                    <Button
                                                        onClick={shareReferral}
                                                        variant="outline"
                                                        className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white min-w-[100px]"
                                                        disabled={!referralLink || copyLoading}
                                                    >
                                                        {copyLoading ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<><Share2 className="h-4 w-4 mr-2" />Share</>)}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* How it Works */}
                                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                            <h3 className="text-xl font-bold text-navy mb-6">How It Works</h3>
                                            <div className="grid md:grid-cols-3 gap-8">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">1</div>
                                                    <h4 className="font-semibold text-navy mb-3 text-lg">Share Your Code</h4>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">Copy your unique referral code or link and share it with friends via message, email, or social media</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">2</div>
                                                    <h4 className="font-semibold text-navy mb-3 text-lg">Friend Signs Up & Buys</h4>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">Your friend registers using your referral code and makes their first qualifying purchase</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">3</div>
                                                    <h4 className="font-semibold text-navy mb-3 text-lg">You Earn Rewards</h4>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">Receive {formatCurrency(50)} directly in your wallet immediately after your friend completes their purchase</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Referral History */}
                                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold text-navy">Referral History</h3>
                                                <Button
                                                    onClick={fetchReferralData}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={loading.referrals}
                                                >
                                                    {loading.referrals ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                                                </Button>
                                            </div>

                                            {referralHistory.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                                    <h4 className="text-lg font-semibold text-navy mb-2">No referrals yet</h4>
                                                    <p className="text-muted-foreground mb-4">Start sharing your referral code to earn rewards!</p>
                                                    <Button
                                                        onClick={shareReferral}
                                                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                                    >
                                                        <Share2 className="h-4 w-4 mr-2" /> Share Your Link
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {referralHistory.map((ref) => (
                                                        <div key={ref._id} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-navy">{ref.referredUser?.name || 'Unknown User'}</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {ref.referredUser?.email || 'No email'} • {formatDate(ref.createdAt)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-navy text-lg">{formatCurrency(ref.rewardAmount)}</p>
                                                                <p className={`text-sm font-medium ${getReferralStatusColor(ref.status)}`}>
                                                                    {getReferralStatusText(ref.status)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Additional Info */}
                                        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-navy mb-2">💡 Tips for Successful Referrals</h4>
                                            <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
                                                <li>Share your referral link on social media platforms</li>
                                                <li>Send personalized messages to friends who might be interested</li>
                                                <li>Explain the benefits they'll get by signing up</li>
                                                <li>Follow up with friends who haven't completed their purchase yet</li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader> <DialogTitle>Edit Profile</DialogTitle> </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"> <Label htmlFor="edit-name">Full Name</Label> <Input id="edit-name" value={editFormData.name} onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))} /> </div>
                            <div className="space-y-2"> <Label htmlFor="edit-email">Email</Label> <Input id="edit-email" type="email" value={editFormData.email} disabled className="opacity-70" /> <p className="text-xs text-muted-foreground">Email cannot be changed</p> </div>
                            <div className="space-y-2"> <Label htmlFor="edit-phone">Phone Number</Label> <Input id="edit-phone" value={editFormData.phone} onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))} /> </div>
                            <div className="space-y-2"> <Label htmlFor="edit-dob">Date of Birth</Label> <Input id="edit-dob" type="date" value={editFormData.dateOfBirth} onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))} /> </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-gender">Gender</Label>
                                <Select value={editFormData.gender} onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value }))}>
                                    <SelectTrigger> <SelectValue placeholder="Select gender" /> </SelectTrigger>
                                    <SelectContent> <SelectItem value="male">Male</SelectItem> <SelectItem value="female">Female</SelectItem> <SelectItem value="other">Other</SelectItem> <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2"> <Label htmlFor="edit-bio">Bio</Label> <Textarea id="edit-bio" value={editFormData.bio} onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell us a little about yourself..." rows={4} /> </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setShowEditProfile(false)} disabled={loading.saving}> Cancel </Button>
                            <Button className="bg-navy hover:bg-navy/90" onClick={handleSaveProfile} disabled={loading.saving}>
                                {loading.saving ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>) : ("Save Changes")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Address Dialog */}
            <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader> <DialogTitle> {editingAddress ? 'Edit Address' : 'Add New Address'} </DialogTitle> </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"> <Label htmlFor="address-name">Full Name</Label> <Input id="address-name" value={addressFormData.name} onChange={(e) => setAddressFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter your full name" /> </div>
                            <div className="space-y-2"> <Label htmlFor="address-phone">Phone Number</Label> <Input id="address-phone" value={addressFormData.phone} onChange={(e) => setAddressFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="Enter your phone number" /> </div>
                            <div className="space-y-2">
                                <Label htmlFor="address-type">Address Type</Label>
                                <Select value={addressFormData.type} onValueChange={(value) => setAddressFormData(prev => ({ ...prev, type: value }))}>
                                    <SelectTrigger> <SelectValue placeholder="Select address type" /> </SelectTrigger>
                                    <SelectContent> <SelectItem value="home">Home</SelectItem> <SelectItem value="work">Work</SelectItem> <SelectItem value="other">Other</SelectItem> </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"> <Label htmlFor="address-pincode">Pincode</Label> <Input id="address-pincode" value={addressFormData.pincode} onChange={(e) => setAddressFormData(prev => ({ ...prev, pincode: e.target.value }))} placeholder="Enter pincode" /> </div>
                        </div>
                        <div className="space-y-2"> <Label htmlFor="address-street">Street Address</Label> <Textarea id="address-street" value={addressFormData.address} onChange={(e) => setAddressFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="Enter your street address" rows={3} /> </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"> <Label htmlFor="address-city">City</Label> <Input id="address-city" value={addressFormData.city} onChange={(e) => setAddressFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="Enter your city" /> </div>
                            <div className="space-y-2"> <Label htmlFor="address-state">State</Label> <Input id="address-state" value={addressFormData.state} onChange={(e) => setAddressFormData(prev => ({ ...prev, state: e.target.value }))} placeholder="Enter your state" /> </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="default-address" checked={addressFormData.isDefault} onChange={(e) => setAddressFormData(prev => ({ ...prev, isDefault: e.target.checked }))} className="rounded border-gray-300" />
                            <Label htmlFor="default-address" className="text-sm font-normal"> Set as default address </Label>
                        </div>
                        <DialogFooter>
                            <div className="flex justify-end gap-3 w-full">
                                <Button variant="outline" onClick={() => setShowAddAddress(false)} disabled={loading.saving}> Cancel </Button>
                                <Button className="bg-navy hover:bg-navy/90" onClick={handleSaveAddress} disabled={loading.saving}>
                                    {loading.saving ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>) : (editingAddress ? "Update Address" : "Add Address")}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Order Details Dialog */}
            <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Order Details - {selectedOrder?.orderNumber}</span>
                            <Button variant="ghost" size="icon" onClick={() => setShowOrderDetails(false)}> <X className="h-4 w-4" /> </Button>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Order Status Timeline */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"> <Package className="h-5 w-5" /> Order Status </h3>
                                <div className="space-y-3">
                                    {selectedOrder.orderStatus?.timeline?.map((timeline, index) => (
                                        <div key={timeline._id} className="flex items-start gap-3">
                                            <div className={`w-3 h-3 rounded-full mt-1.5 ${index === selectedOrder.orderStatus.timeline.length - 1 ? 'bg-green-500' : 'bg-blue-500'}`} />
                                            <div className="flex-1">
                                                <p className="font-medium capitalize">{timeline.status}</p>
                                                <p className="text-sm text-muted-foreground">{timeline.description}</p>
                                                <p className="text-xs text-muted-foreground"> {formatDateTime(timeline.timestamp)} </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                                <div className="space-y-4">
                                    {selectedOrder.orderItems?.map((item) => (
                                        <div key={item._id} className="flex gap-4 p-3 border rounded-lg">
                                            <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                                                <img src={item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{item.name}</h4>
                                                <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                                                    <span>Qty: {item.quantity}</span>
                                                    {item.color && item.color !== 'default' && (<span>Color: {item.color}</span>)}
                                                    {item.size && item.size !== 'One Size' && (<span>Size: {item.size}</span>)}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="font-semibold">{formatCurrency(item.price)}</span>
                                                    {item.originalPrice > item.price && (<span className="text-sm text-muted-foreground line-through"> {formatCurrency(item.originalPrice)} </span>)}
                                                    <span className="ml-auto font-semibold"> {formatCurrency(item.itemTotal)} </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Shipping Address */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"> <MapPin className="h-5 w-5" /> Shipping Address </h3>
                                    <div className="p-3 border rounded-lg">
                                        <p className="font-medium">{selectedOrder.shippingAddress?.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress?.address}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2"> Phone: {selectedOrder.shippingAddress?.phone} </p>
                                    </div>
                                </div>

                                {/* Payment & Delivery Info */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"> <CreditCard className="h-5 w-5" /> Payment Information </h3>
                                        <div className="p-3 border rounded-lg">
                                            <p className="font-medium capitalize"> {getPaymentMethodLabel(selectedOrder.paymentDetails?.method)} </p>
                                            <p className="text-sm text-muted-foreground capitalize"> Status: {selectedOrder.paymentDetails?.status} </p>
                                            <p className="text-sm text-muted-foreground"> Amount: {formatCurrency(selectedOrder.paymentDetails?.amount)} </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"> <Calendar className="h-5 w-5" /> Delivery Information </h3>
                                        <div className="p-3 border rounded-lg">
                                            <p className="font-medium"> Expected Delivery: {formatDate(selectedOrder.deliveryDetails?.expectedDelivery)} </p>
                                            <p className="text-sm text-muted-foreground"> Method: {selectedOrder.deliveryDetails?.shippingMethod} </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between"> <span>Subtotal ({selectedOrder.orderSummary?.itemsCount} items):</span> <span>{formatCurrency(selectedOrder.orderSummary?.subtotal)}</span> </div>
                                    <div className="flex justify-between">
                                        <span>Shipping:</span>
                                        <span className={selectedOrder.orderSummary?.shipping === 0 ? 'text-green-600' : ''}>
                                            {selectedOrder.orderSummary?.shipping === 0 ? 'Free' : formatCurrency(selectedOrder.orderSummary?.shipping)}
                                        </span>
                                    </div>
                                    {selectedOrder.orderSummary?.discount > 0 && (
                                        <div className="flex justify-between">
                                            <span>Discount:</span>
                                            <span className="text-green-600"> -{formatCurrency(selectedOrder.orderSummary?.discount)} </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                                        <span>Total:</span>
                                        <span>{formatCurrency(selectedOrder.orderSummary?.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Metadata */}
                            <div className="text-xs text-muted-foreground">
                                <p>Order placed on: {formatDateTime(selectedOrder.createdAt)}</p>
                                <p>Source: {selectedOrder.metadata?.source === 'buy_now' ? 'Buy Now' : 'Shopping Cart'}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Profile;