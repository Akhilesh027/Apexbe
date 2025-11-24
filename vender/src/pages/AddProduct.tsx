import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Addproduct = () => {
    const vendorId = localStorage.getItem("vendorId");
    const [currentStep, setCurrentStep] = useState(1);
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
    const [addingSubcategory, setAddingSubcategory] = useState(false); // NEW: State for adding a new subcategory

    // ITEM TYPE (Product / Service)
    const [itemType, setItemType] = useState("product");
    const navigate = useNavigate();

    // PRICE TYPE (product-wise / order-wise)
    const [priceType, setPriceType] = useState("product-wise");

    // Categories
    // Assuming categories will now hold the full category object including its subcategories array
    const [categories, setCategories] = useState([]); 
    const [subcategories, setSubcategories] = useState([]);
    const [category, setCategory] = useState("");
    const [subcategory, setSubcategory] = useState("");
    const [newSubcategory, setNewSubcategory] = useState(""); // NEW: Input for adding a new subcategory

    // PRODUCT DETAILS
    const [itemName, setItemName] = useState("");
    const [gstRate, setGstRate] = useState(""); 
    const [description, setDescription] = useState("");
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    // STOCK DETAILS
    const [measuringUnit, setMeasuringUnit] = useState("PCS");
    const [customUnitInput, setCustomUnitInput] = useState("");
    const [unitList, setUnitList] = useState(["PCS", "KG", "GMS", "LTR", "ML", "BOX", "BAG"]);

    const [hsnCode, setHsnCode] = useState("");
    const [godownList, setGodownList] = useState(["Main Godown"]);
    const [godown, setGodown] = useState("");
    const [newGodown, setNewGodown] = useState("");

    const [openStock, setOpenStock] = useState("");
    const [asOnDate, setAsOnDate] = useState("");

    // PRICE DETAILS
    const [mrp, setMrp] = useState("");
    const [discount, setDiscount] = useState(""); 
    const [afterDiscount, setAfterDiscount] = useState("");
    const [finalAmount, setFinalAmount] = useState("");
    const [commission] = useState(20);

    // 💰 NEW STATES for Flexible Pricing Calculations
    const [gstAmount, setGstAmount] = useState(""); 
    const [discountAmount, setDiscountAmount] = useState(""); 

    const [gstInputType, setGstInputType] = useState('percentage'); 
    const [discountInputType, setDiscountInputType] = useState('percentage'); 

    /* ---------------- FETCH BUSINESS ---------------- */
    useEffect(() => {
        if (!vendorId) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await axios.get(
                    `https://api.apexbee.in/api/business/get-business/${vendorId}`
                );
                setBusiness(res.data.business);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [vendorId]);

    /* ---------------- SKU PREVIEW (Frontend only) ---------------- */
    const previewSKU = () => {
        if (!vendorId || !itemName) return "";
        const vendorPart = vendorId.slice(-3).toUpperCase();
        const namePart = itemName.replace(/\s+/g, "").slice(0, 3).toUpperCase();
        return `APX-${vendorPart}-${namePart}-XXXX`;
    };

    /* ---------------- FETCH CATEGORIES ---------------- */
    useEffect(() => {
        setCategoriesLoading(true);
        axios
            // Assuming this endpoint now returns the category object *with* its embedded subcategories array
            .get("https://api.apexbee.in/api/categories")
            .then((res) => setCategories(res.data.categories || []))
            .catch(console.error)
            .finally(() => setCategoriesLoading(false));
    }, []);

    /* ---------------- POPULATE SUBCATEGORIES ON CATEGORY CHANGE ---------------- */
    useEffect(() => {
        setSubcategory(""); // Reset subcategory selection
        const selectedCategory = categories.find(cat => cat._id === category);

        if (selectedCategory && selectedCategory.subcategories) {
            setSubcategories(selectedCategory.subcategories);
        } else {
            setSubcategories([]);
        }
    }, [category, categories]);


    /* ---------------- NEW: ADD SUBCATEGORY HANDLER ---------------- */
  // Inside the addNewSubcategory function in Addproduct.jsx

const addNewSubcategory = async () => {
    const subName = newSubcategory.trim();
    if (!subName || !category) {
        alert("Please select a category and enter a subcategory name.");
        return;
    }

    setAddingSubcategory(true);
    try {
        const res = await axios.post(
            // API call now uses the parent category ID in the URL
            `https://api.apexbee.in/api/categories/${category}/subcategories`, 
            { name: subName } // Send the new subcategory name in the body
        );

        // Update local state based on the response
        setCategories(prevCategories => 
            prevCategories.map(cat => 
                cat._id === category ? res.data.updatedCategory : cat
            )
        );

        // Set the newly created subcategory as selected
        setSubcategory(res.data.newSubcategoryId); 

        setNewSubcategory(""); 
        alert(`${subName} added successfully to the category!`);

    } catch (err) {
        // ... error handling
    } finally {
        setAddingSubcategory(false);
    }
};
    // 💰 NEW HANDLERS for Price Input Types (Keeping for completeness)
    const handleGstRateChange = (value) => {
        setGstInputType('percentage');
        setGstRate(value);
    };

    const handleGstAmountChange = (e) => {
        setGstInputType('amount');
        setGstAmount(e.target.value);
    };

    const handleDiscountChange = (e) => {
        setDiscountInputType('percentage');
        setDiscount(e.target.value);
    };

    const handleDiscountAmountChange = (e) => {
        setDiscountInputType('amount');
        setDiscountAmount(e.target.value);
    };

    /* ---------------- PRICE CALCULATIONS WITH GST (Keeping for completeness) ---------------- */
    useEffect(() => {
        // ... (existing price calculation logic)
        if (priceType === "order-wise") {
            setAfterDiscount("");
            setFinalAmount("");
            return;
        }

        const basePrice = Number(mrp) || 0;
        if (!basePrice) {
            setAfterDiscount("");
            setFinalAmount("");
            setGstAmount("");
            setDiscountAmount("");
            return;
        }

        // --- 1. DETERMINE GST (Rate/Percentage vs. Amount) ---
        let actualGstRate = 0;
        let calculatedGstAmount = 0;

        if (business?.gstApplicable) {
            if (gstInputType === 'percentage') {
                actualGstRate = Number(gstRate) || 0;
                calculatedGstAmount = (basePrice * actualGstRate) / 100;
                setGstAmount(calculatedGstAmount.toFixed(2));
            } else if (gstInputType === 'amount') {
                calculatedGstAmount = Number(gstAmount) || 0;
                actualGstRate = (calculatedGstAmount / basePrice) * 100;
                setGstRate(isNaN(actualGstRate) || !isFinite(actualGstRate) ? "" : actualGstRate.toFixed(2));
            }
        } else {
            setGstRate("");
            setGstAmount("");
        }
        
        const priceWithGST = basePrice + calculatedGstAmount;

        // --- 2. DETERMINE DISCOUNT (Percentage vs. Amount) ---
        let actualDiscountPercentage = 0;
        let calculatedDiscountAmount = 0;

        if (discountInputType === 'percentage') {
            actualDiscountPercentage = Number(discount) || 0;
            calculatedDiscountAmount = (priceWithGST * actualDiscountPercentage) / 100;
            setDiscountAmount(calculatedDiscountAmount.toFixed(2));
        } else if (discountInputType === 'amount') {
            calculatedDiscountAmount = Number(discountAmount) || 0;
            actualDiscountPercentage = (calculatedDiscountAmount / priceWithGST) * 100;
            setDiscount(isNaN(actualDiscountPercentage) || !isFinite(actualDiscountPercentage) ? "" : actualDiscountPercentage.toFixed(2));
        }

        // Price after discount (applied on base price + GST)
        const ad = priceWithGST - calculatedDiscountAmount;
        setAfterDiscount(isNaN(ad) ? "" : ad.toFixed(2));

        // Final amount after commission
        const final = ad - commission;
        setFinalAmount(isNaN(final) ? "" : final.toFixed(2));
    }, [mrp, discount, gstRate, priceType, commission, gstInputType, gstAmount, discountInputType, discountAmount, business]);


    /* ---------------- IMAGE HANDLER WITH PREVIEW (Keeping for completeness) ---------------- */
    const handleImageUpload = (e) => {
        // ... (existing image logic)
        const files = Array.from(e.target.files);
        setImages(files);

        const previewUrls = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previewUrls);
    };

    const removeImage = (index) => {
        // ... (existing image logic)
        const newImages = [...images];
        const newPreviews = [...imagePreviews];

        URL.revokeObjectURL(newPreviews[index]);

        newImages.splice(index, 1);
        newPreviews.splice(index, 1);

        setImages(newImages);
        setImagePreviews(newPreviews);
    };

    /* ---------------- ADD GODOWN (Keeping for completeness) ---------------- */
    const addGodown = () => {
        const v = newGodown.trim();
        if (!v) return;
        if (!godownList.includes(v)) setGodownList((s) => [...s, v]);
        setGodown(v);
        setNewGodown("");
    };

    /* ---------------- ADD MEASURING UNIT (Keeping for completeness) ---------------- */
    const addMeasureUnit = () => {
        const v = customUnitInput.trim();
        if (!v) return;
        if (!unitList.includes(v)) setUnitList((s) => [...s, v]);
        setMeasuringUnit(v);
        setCustomUnitInput("");
    };

    /* ---------------- STEP NAVIGATION (Keeping for completeness) ---------------- */
    const nextStep = () => {
        if (currentStep === 1 && (!category || !itemName)) {
            alert("Please fill required fields (Category & Item Name).");
            return;
        }
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    /* ---------------- SUBMIT HANDLER (Keeping for completeness) ---------------- */
    const handleSubmit = async () => {
        if (!category || !itemName) {
            alert("Please fill required fields (Category & Item Name).");
            return;
        }

        setSubmitting(true);
        const fd = new FormData();

        fd.append("vendorId", vendorId);
        fd.append("itemType", itemType);
        fd.append("category", category);
        fd.append("subcategory", subcategory); // Send selected subcategory ID/Name
        fd.append("itemName", itemName);

        fd.append("gstRate", gstRate || "");
        
        fd.append("description", description || "");

        fd.append("measuringUnit", itemType === "Service" ? "" : measuringUnit);
        fd.append("hsnCode", itemType === "Service" ? "" : hsnCode);
        fd.append("godown", itemType === "Service" ? "" : godown);
        fd.append("openStock", itemType === "Service" ? 0 : openStock);
        fd.append("asOnDate", itemType === "Service" ? "" : asOnDate);

        fd.append("mrp", mrp || "");
        fd.append("discount", discount || ""); 
        fd.append("afterDiscount", afterDiscount || "");
        fd.append("commission", commission || 0);
        fd.append("finalAmount", finalAmount || "");
        fd.append("priceType", priceType);

        images.forEach((img) => fd.append("images", img));

        try {
            const res = await axios.post(
                "https://api.apexbee.in/api/products/add-product",
                fd,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            alert(`Product Added Successfully!`);
            navigate("/products");
        } catch (err) {
            console.error(err);
            alert("Error adding product");
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------------- LOADING COMPONENTS (Keeping for completeness) ---------------- */
    const LoadingSpinner = ({ size = "default" }) => (
        <div className={`flex items-center justify-center ${
            size === "sm" ? "py-1" : "py-4"
            }`}>
            <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${
                size === "sm" ? "w-4 h-4" : "w-6 h-6"
                }`}></div>
        </div>
    );

    const SkeletonLoader = () => (
        <div className="animate-pulse space-y-2">
            <div className="bg-gray-200 h-4 rounded w-3/4"></div>
            <div className="bg-gray-200 h-10 rounded w-full"></div>
        </div>
    );

    /* ---------------- STEP INDICATOR (Keeping for completeness) ---------------- */
    const StepIndicator = () => (
        <div className="flex justify-center mb-8">
            <div className="flex items-center">
                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                currentStep >= step
                                    ? "bg-primary text-white border-primary"
                                    : "bg-muted border-muted-foreground text-muted-foreground"
                                }`}
                        >
                            {step}
                        </div>
                        {step < 3 && (
                            <div
                                className={`w-16 h-1 ${
                                    currentStep > step ? "bg-primary" : "bg-muted"
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    /* ---------------- UI ---------------- */
    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto px-5 pb-10">

                {/* STEP INDICATOR */}
                <StepIndicator />

                {/* LOADING OVERLAY */}
                {loading && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-lg font-semibold">Loading product form...</p>
                        </div>
                    </div>
                )}

                {/* STEP 1: PRODUCT DETAILS */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-center mb-6">Product Details</h2>

                        {/* ITEM TYPE */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-semibold text-lg">Item Type</Label>
                            <RadioGroup
                                value={itemType}
                                onValueChange={(value) => setItemType(value)}
                                className="flex gap-6 mt-3"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="product" id="product" />
                                    <Label htmlFor="product" className="text-base">Product</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="service" id="service" />
                                    <Label htmlFor="service" className="text-base">Service</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* CATEGORY */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-bold text-lg">Category *</Label>
                            {categoriesLoading ? (
                                <SkeletonLoader />
                            ) : (
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="mt-3 h-12">
                                        {categoriesLoading ? (
                                            <div className="flex items-center">
                                                <LoadingSpinner size="sm" />
                                                <span className="ml-2">Loading categories...</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="Select Category" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* NEW: SUBCATEGORY */}
                        {category && (
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Subcategory</Label>
                                <div className="mt-3 space-y-4">
                                    {/* Existing Subcategories Selector */}
                                    {subcategoriesLoading ? (
                                        <SkeletonLoader />
                                    ) : (
                                        <Select value={subcategory} onValueChange={setSubcategory} disabled={!category || submitting}>
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Select Subcategory (Optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subcategories.map((sub) => (
                                                    // Assuming subcategory model includes an _id 
                                                    <SelectItem key={sub._id} value={sub._id}> 
                                                        {sub.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {/* Add New Subcategory Form */}
                                    <div className="p-2 border-t mt-1">
                                        <Label className="font-semibold text-sm block mb-2">Add New Subcategory</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter new subcategory name"
                                                value={newSubcategory}
                                                onChange={(e) => setNewSubcategory(e.target.value)}
                                                className="h-10"
                                                disabled={submitting || addingSubcategory}
                                            />
                                            <Button 
                                                onClick={addNewSubcategory} 
                                                className="h-10" 
                                                disabled={submitting || addingSubcategory || !category}
                                            >
                                                {addingSubcategory ? <LoadingSpinner size="sm" /> : "+ Add"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ITEM NAME */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-bold text-lg">Item Name *</Label>
                            <Input
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                className="mt-3 h-12"
                                placeholder="Enter product name"
                                disabled={submitting}
                            />
                        </div>

                        {/* 💰 FLEXIBLE GST INPUT (Percentage or Amount) */}
                        {business?.gstApplicable && (
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">GST Rate/Amount *</Label>
                                <div className="flex gap-3 items-center mt-3">
                                    {/* Input Field (Swaps between % and ₹ input) */}
                                    <div className="flex-1">
                                        <Input
                                            value={gstInputType === 'percentage' ? gstRate : gstAmount}
                                            onChange={gstInputType === 'percentage' ? (e) => handleGstRateChange(e.target.value) : handleGstAmountChange}
                                            className="h-12"
                                            placeholder={gstInputType === 'percentage' ? "GST %" : "GST Amount (₹)"}
                                            type="number"
                                            disabled={submitting || priceType === "order-wise"}
                                        />
                                    </div>

                                    {/* Toggle Button */}
                                    <Button
                                        onClick={() => setGstInputType(gstInputType === 'percentage' ? 'amount' : 'percentage')}
                                        variant="secondary"
                                        className="h-12"
                                        disabled={submitting || priceType === "order-wise"}
                                    >
                                        {gstInputType === 'percentage' ? 'Use Amt' : 'Use %'}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Current GST:
                                    **{gstInputType === 'percentage'
                                        ? `₹${(Number(gstAmount) || 0).toFixed(2)} (${(Number(gstRate) || 0).toFixed(2)}%)`
                                        : `${(Number(gstRate) || 0).toFixed(2)}% (₹${(Number(gstAmount) || 0).toFixed(2)})`}**
                                </p>
                            </div>
                        )}

                        {/* DESCRIPTION */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-bold text-lg">Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mt-3 min-h-[120px]"
                                placeholder="Enter product description..."
                                disabled={submitting}
                            />
                        </div>

                        {/* IMAGES WITH PREVIEW */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-bold text-lg">Upload Images</Label>

                            {/* File Input with Custom Styling */}
                            <div className="mt-4 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                    disabled={submitting}
                                />
                                <label
                                    htmlFor="image-upload"
                                    className={`cursor-pointer block ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-medium">Click to upload images</p>
                                        <p className="text-sm text-muted-foreground">PNG, JPG, JPEG up to 10MB</p>
                                    </div>
                                </label>
                            </div>

                            {/* Image Previews */}
                            {imagePreviews.length > 0 && (
                                <div className="mt-6">
                                    <Label className="font-semibold">Image Previews</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg border"
                                                />
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    disabled={submitting}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: STOCK SECTION (Keeping for completeness) */}
                {currentStep === 2 && itemType === "product" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-center mb-6">Stock Details</h2>

                        {/* AUTO SKU PREVIEW */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-bold text-lg">SKU Code (Auto Generated)</Label>
                            <Input value={previewSKU()} readOnly className="mt-3 h-12 bg-muted" />
                            <p className="text-sm text-muted-foreground mt-2">
                                Final SKU will be generated automatically after saving.
                            </p>
                        </div>

                        {/* MEASURING UNIT */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-bold text-lg">Measuring Unit *</Label>
                            <div className="flex gap-3 items-center mt-3">
                                <Select value={measuringUnit} onValueChange={setMeasuringUnit} disabled={submitting}>
                                    <SelectTrigger className="flex-1 h-12">
                                        <SelectValue placeholder="Select Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unitList.map((u) => (
                                            <SelectItem key={u} value={u}>
                                                {u}
                                            </SelectItem>
                                        ))}

                                        <div className="p-2 border-t mt-1">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add custom unit"
                                                    value={customUnitInput}
                                                    onChange={(e) => setCustomUnitInput(e.target.value)}
                                                    className="h-10"
                                                    disabled={submitting}
                                                />
                                                <Button onClick={addMeasureUnit} className="h-10" disabled={submitting}>
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* HSN */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-bold text-lg">HSN Code</Label>
                            <Input
                                value={hsnCode}
                                onChange={(e) => setHsnCode(e.target.value)}
                                className="mt-3 h-12"
                                placeholder="Enter HSN code"
                                disabled={submitting}
                            />
                        </div>

                        {/* GODOWN */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-bold text-lg">Godown / Shop *</Label>
                            <div className="flex gap-3 items-center mt-3">
                                <Select value={godown} onValueChange={setGodown} disabled={submitting}>
                                    <SelectTrigger className="flex-1 h-12">
                                        <SelectValue placeholder="Select Godown / Shop" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {godownList.map((g) => (
                                            <SelectItem key={g} value={g}>
                                                {g}
                                            </SelectItem>
                                        ))}

                                        <div className="p-2 border-t mt-1">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add Godown / Shop"
                                                    value={newGodown}
                                                    onChange={(e) => setNewGodown(e.target.value)}
                                                    className="h-10"
                                                    disabled={submitting}
                                                />
                                                <Button onClick={addGodown} className="h-10" disabled={submitting}>
                                                    + Add
                                                </Button>
                                            </div>
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* OPEN STOCK / DATE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Open Stock</Label>
                                <div className="flex gap-3 items-center mt-3">
                                    <Input
                                        value={openStock}
                                        onChange={(e) => setOpenStock(e.target.value)}
                                        className="h-12"
                                        placeholder="0"
                                        type="number"
                                        disabled={submitting}
                                    />
                                    <div className="px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium min-w-[80px] text-center">
                                        {measuringUnit}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Current stock quantity in {measuringUnit}
                                </p>
                            </div>

                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">As On Date</Label>
                                <Input
                                    type="date"
                                    value={asOnDate}
                                    onChange={(e) => setAsOnDate(e.target.value)}
                                    className="mt-3 h-12"
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: PRICE SECTION (Keeping for completeness) */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-center mb-6">Price Details</h2>

                        {/* PRICE TYPE */}
                        <div className="bg-card p-6 rounded-lg border">
                            <Label className="font-bold text-lg mb-4 block">PRICE TYPE</Label>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div
                                    className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        priceType === "product-wise"
                                            ? "border-primary bg-primary/5"
                                            : "border-muted hover:border-muted-foreground/50"
                                        } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => !submitting && setPriceType("product-wise")}
                                >
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="product-wise"
                                            checked={priceType === "product-wise"}
                                            onChange={() => !submitting && setPriceType("product-wise")}
                                            className="w-4 h-4"
                                            disabled={submitting}
                                        />
                                        <span className="font-medium">Product Wise Pricing</span>
                                    </label>
                                    <p className="text-sm text-muted-foreground mt-2 ml-7">
                                        Set individual prices for this product
                                    </p>
                                </div>

                                <div
                                    className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        priceType === "order-wise"
                                            ? "border-primary bg-primary/5"
                                            : "border-muted hover:border-muted-foreground/50"
                                        } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => !submitting && setPriceType("order-wise")}
                                >
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="order-wise"
                                            checked={priceType === "order-wise"}
                                            onChange={() => !submitting && setPriceType("order-wise")}
                                            className="w-4 h-4"
                                            disabled={submitting}
                                        />
                                        <span className="font-medium">Order Wise Pricing</span>
                                    </label>
                                    <p className="text-sm text-muted-foreground mt-2 ml-7">
                                        Set prices based on order quantity
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* PRICE FIELDS */}
                        <div className="space-y-6">
                            {/* MRP */}
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Maximum Retail Price (MRP) *</Label>
                                <Input
                                    disabled={priceType === "order-wise" || submitting}
                                    value={mrp}
                                    onChange={(e) => setMrp(e.target.value)}
                                    className="mt-3 h-12"
                                    placeholder="0.00"
                                    type="number"
                                />
                            </div>

                            {/* 💰 FLEXIBLE GST INPUT (Percentage or Amount) */}
                            {business?.gstApplicable && (
                                <div className="bg-card p-6 rounded-lg border">
                                    <Label className="font-bold text-lg">GST Rate/Amount *</Label>
                                    <div className="flex gap-3 items-center mt-3">
                                        {/* Input Field (Swaps between % and ₹ input) */}
                                        <div className="flex-1">
                                            <Input
                                                value={gstInputType === 'percentage' ? gstRate : gstAmount}
                                                onChange={gstInputType === 'percentage' ? (e) => handleGstRateChange(e.target.value) : handleGstAmountChange}
                                                className="h-12"
                                                placeholder={gstInputType === 'percentage' ? "GST %" : "GST Amount (₹)"}
                                                type="number"
                                                disabled={submitting || priceType === "order-wise"}
                                            />
                                        </div>

                                        {/* Toggle Button */}
                                        <Button
                                            onClick={() => setGstInputType(gstInputType === 'percentage' ? 'amount' : 'percentage')}
                                            variant="secondary"
                                            className="h-12"
                                            disabled={submitting || priceType === "order-wise"}
                                        >
                                            {gstInputType === 'percentage' ? 'Use Amt' : 'Use %'}
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Current GST:
                                        **{gstInputType === 'percentage'
                                            ? `₹${(Number(gstAmount) || 0).toFixed(2)} (${(Number(gstRate) || 0).toFixed(2)}%)`
                                            : `${(Number(gstRate) || 0).toFixed(2)}% (₹${(Number(gstAmount) || 0).toFixed(2)})`}**
                                    </p>
                                </div>
                            )}

                            {/* GST CALCULATION DISPLAY */}
                            {business?.gstApplicable && mrp && (
                                <div className="bg-card p-6 rounded-lg border">
                                    <Label className="font-bold text-lg">GST Calculation</Label>
                                    <div className="mt-3 space-y-2">
                                        <div className="flex justify-between">
                                            <span>Base Price:</span>
                                            <span>₹{Number(mrp).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>GST ({Number(gstRate) || 0}%):</span>
                                            <span>₹{(Number(gstAmount) || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t pt-2">
                                            <span>Total with GST:</span>
                                            <span>₹{(Number(mrp) + (Number(gstAmount) || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 💰 FLEXIBLE DISCOUNT INPUT (Percentage or Amount) */}
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Discount</Label>
                                <div className="flex gap-3 items-center mt-3">
                                    {/* Input Field (Swaps between % and ₹ input) */}
                                    <div className="flex-1">
                                        <Input
                                            disabled={priceType === "order-wise" || submitting}
                                            value={discountInputType === 'percentage' ? discount : discountAmount}
                                            onChange={discountInputType === 'percentage' ? handleDiscountChange : handleDiscountAmountChange}
                                            className="h-12"
                                            placeholder={discountInputType === 'percentage' ? "Discount %" : "Discount Amount (₹)"}
                                            type="number"
                                        />
                                    </div>

                                    {/* Toggle Button */}
                                    <Button
                                        onClick={() => setDiscountInputType(discountInputType === 'percentage' ? 'amount' : 'percentage')}
                                        variant="secondary"
                                        className="h-12"
                                        disabled={priceType === "order-wise" || submitting}
                                    >
                                        {discountInputType === 'percentage' ? 'Use Amt' : 'Use %'}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Current Discount:
                                    **{discountInputType === 'percentage'
                                        ? `₹${(Number(discountAmount) || 0).toFixed(2)} (${(Number(discount) || 0).toFixed(2)}%)`
                                        : `${(Number(discount) || 0).toFixed(2)}% (₹${(Number(discountAmount) || 0).toFixed(2)})`}**
                                </p>
                            </div>

                            {/* AFTER DISCOUNT */}
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">After Discount Sale Price</Label>
                                <Input
                                    disabled
                                    value={afterDiscount}
                                    className="mt-3 h-12 bg-muted"
                                />
                            </div>

                            {/* COMMISSION */}
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Apex Bee Commission</Label>
                                <Input
                                    disabled
                                    value={commission}
                                    className="mt-3 h-12 bg-muted"
                                />
                            </div>

                            {/* FINAL AMOUNT */}
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Final You Get Amount</Label>
                                <Input
                                    disabled
                                    value={finalAmount}
                                    className="mt-3 h-12 bg-muted"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* NAVIGATION BUTTONS */}
                <div className="flex justify-between mt-10">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1 || submitting}
                        className="px-8 py-3"
                    >
                        {submitting ? <LoadingSpinner size="sm" /> : "Previous"}
                    </Button>

                    {currentStep < 3 ? (
                        <Button
                            onClick={nextStep}
                            disabled={submitting}
                            className="px-8 py-3"
                        >
                            {submitting ? <LoadingSpinner size="sm" /> : "Next Step"}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-8 py-3 bg-green-600 hover:bg-green-700"
                        >
                            {submitting ? (
                                <div className="flex items-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    <span>Saving Product...</span>
                                </div>
                            ) : (
                                "SAVE PRODUCT"
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default Addproduct;