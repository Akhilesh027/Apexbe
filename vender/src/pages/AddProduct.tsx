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
    const [addingSubcategory, setAddingSubcategory] = useState(false);

    // ITEM TYPE (Product / Service)
    const [itemType, setItemType] = useState("product");
    const navigate = useNavigate();

    // PRICE TYPE (product-wise / order-wise)
    const [priceType, setPriceType] = useState("product-wise");

    // Categories
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [category, setCategory] = useState("");
    const [subcategory, setSubcategory] = useState("");
    const [newSubcategory, setNewSubcategory] = useState("");

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

    // 💰 UPDATED STATES for Flexible Pricing Calculations
    const [gstAmount, setGstAmount] = useState("");
    const [discountAmount, setDiscountAmount] = useState("");

    // Input type states
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

    /* ---------------- SKU PREVIEW ---------------- */
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

    /* ---------------- ADD SUBCATEGORY HANDLER ---------------- */
    const addNewSubcategory = async () => {
        const subName = newSubcategory.trim();
        if (!subName || !category) {
            alert("Please select a category and enter a subcategory name.");
            return;
        }

        setAddingSubcategory(true);
        try {
            const res = await axios.post(
                `https://api.apexbee.in/api/categories/${category}/subcategories`,
                { name: subName }
            );

            setCategories(prevCategories =>
                prevCategories.map(cat =>
                    cat._id === category ? res.data.updatedCategory : cat
                )
            );

            setSubcategory(res.data.newSubcategoryId);
            setNewSubcategory("");
            alert(`${subName} added successfully to the category!`);

        } catch (err) {
            console.error(err);
            alert("Error adding subcategory.");
        } finally {
            setAddingSubcategory(false);
        }
    };

    /* ---------------- UPDATED: GST HANDLERS ---------------- */
    const handleGstRateChange = (value) => {
        const numValue = Number(value) || 0;
        setGstRate(value);
        
        if (priceType !== "order-wise" && mrp && numValue > 0) {
            const basePrice = Number(mrp);
            const calculatedGstAmount = (basePrice * numValue) / 100;
            setGstAmount(calculatedGstAmount.toFixed(2));
        } else {
            setGstAmount("");
        }
    };

    const handleGstAmountChange = (value) => {
        const numValue = Number(value) || 0;
        setGstAmount(value);
        
        if (priceType !== "order-wise" && mrp && numValue > 0) {
            const basePrice = Number(mrp);
            const calculatedGstRate = (numValue / basePrice) * 100;
            setGstRate(calculatedGstRate.toFixed(2));
        } else {
            setGstRate("");
        }
    };

    /* ---------------- UPDATED: DISCOUNT HANDLERS ---------------- */
    const handleDiscountChange = (value) => {
        const numValue = Number(value) || 0;
        setDiscount(value);
        
        if (priceType !== "order-wise" && mrp && numValue > 0) {
            const basePrice = Number(mrp);
            const gstAmt = Number(gstAmount) || 0;
            const priceWithGST = basePrice + gstAmt;
            const calculatedDiscountAmount = (priceWithGST * numValue) / 100;
            setDiscountAmount(calculatedDiscountAmount.toFixed(2));
        } else {
            setDiscountAmount("");
        }
    };

    const handleDiscountAmountChange = (value) => {
        const numValue = Number(value) || 0;
        setDiscountAmount(value);
        
        if (priceType !== "order-wise" && mrp && numValue > 0) {
            const basePrice = Number(mrp);
            const gstAmt = Number(gstAmount) || 0;
            const priceWithGST = basePrice + gstAmt;
            const calculatedDiscountRate = (numValue / priceWithGST) * 100;
            setDiscount(calculatedDiscountRate.toFixed(2));
        } else {
            setDiscount("");
        }
    };

    /* ---------------- UPDATED: PRICE CALCULATIONS ---------------- */
    useEffect(() => {
        if (priceType === "order-wise") {
            setAfterDiscount("");
            setFinalAmount("");
            return;
        }

        const basePrice = Number(mrp) || 0;
        if (!basePrice) {
            setAfterDiscount("");
            setFinalAmount("");
            return;
        }

        // Calculate GST amount if not already set
        let actualGstAmount = Number(gstAmount) || 0;
        if (business?.gstApplicable && gstInputType === 'percentage' && gstRate) {
            actualGstAmount = (basePrice * Number(gstRate)) / 100;
            setGstAmount(actualGstAmount.toFixed(2));
        }

        const priceWithGST = basePrice + actualGstAmount;

        // Calculate discount amount if not already set
        let actualDiscountAmount = Number(discountAmount) || 0;
        if (discountInputType === 'percentage' && discount) {
            actualDiscountAmount = (priceWithGST * Number(discount)) / 100;
            setDiscountAmount(actualDiscountAmount.toFixed(2));
        }

        // Price after discount
        const ad = priceWithGST - actualDiscountAmount;
        setAfterDiscount(ad > 0 ? ad.toFixed(2) : "0.00");

        // Final amount (before admin commission)
        setFinalAmount(ad > 0 ? ad.toFixed(2) : "0.00");

    }, [mrp, discount, gstRate, priceType, gstInputType, gstAmount, discountInputType, discountAmount, business]);

    /* ---------------- RESET CALCULATIONS WHEN MRP CHANGES ---------------- */
    useEffect(() => {
        if (priceType === "order-wise") return;
        
        const basePrice = Number(mrp) || 0;
        if (!basePrice) {
            setGstAmount("");
            setDiscountAmount("");
            setAfterDiscount("");
            setFinalAmount("");
            return;
        }

        // Recalculate GST if in percentage mode
        if (business?.gstApplicable && gstInputType === 'percentage' && gstRate) {
            const calculatedGstAmount = (basePrice * Number(gstRate)) / 100;
            setGstAmount(calculatedGstAmount.toFixed(2));
        }

        // Recalculate discount if in percentage mode
        if (discountInputType === 'percentage' && discount) {
            const gstAmt = Number(gstAmount) || 0;
            const priceWithGST = basePrice + gstAmt;
            const calculatedDiscountAmount = (priceWithGST * Number(discount)) / 100;
            setDiscountAmount(calculatedDiscountAmount.toFixed(2));
        }

    }, [mrp]);

    /* ---------------- IMAGE HANDLER ---------------- */
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);

        const previewUrls = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previewUrls);
    };

    const removeImage = (index) => {
        const newImages = [...images];
        const newPreviews = [...imagePreviews];

        URL.revokeObjectURL(newPreviews[index]);

        newImages.splice(index, 1);
        newPreviews.splice(index, 1);

        setImages(newImages);
        setImagePreviews(newPreviews);
    };

    /* ---------------- ADD GODOWN ---------------- */
    const addGodown = () => {
        const v = newGodown.trim();
        if (!v) return;
        if (!godownList.includes(v)) setGodownList((s) => [...s, v]);
        setGodown(v);
        setNewGodown("");
    };

    /* ---------------- ADD MEASURING UNIT ---------------- */
    const addMeasureUnit = () => {
        const v = customUnitInput.trim();
        if (!v) return;
        if (!unitList.includes(v)) setUnitList((s) => [...s, v]);
        setMeasuringUnit(v);
        setCustomUnitInput("");
    };

    /* ---------------- STEP NAVIGATION ---------------- */
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

    /* ---------------- SUBMIT HANDLER ---------------- */
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
        fd.append("subcategory", subcategory);
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

    /* ---------------- LOADING COMPONENTS ---------------- */
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

    /* ---------------- STEP INDICATOR ---------------- */
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

                        {/* SUBCATEGORY */}
                        {category && (
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Subcategory</Label>
                                <div className="mt-3 space-y-4">
                                    <Select value={subcategory} onValueChange={setSubcategory} disabled={!category || submitting}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select Subcategory (Optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subcategories.map((sub) => (
                                                <SelectItem key={sub._id} value={sub._id}>
                                                    {sub.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

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

                        {/* GST INPUT - STEP 1 */}
                        {business?.gstApplicable && (
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">GST Rate/Amount *</Label>
                                
                                {/* Percentage Input */}
                                <div className="mt-3">
                                    <Label className="text-sm font-medium mb-2 block">GST Percentage (%)</Label>
                                    <Input
                                        value={gstRate}
                                        onChange={(e) => handleGstRateChange(e.target.value)}
                                        className="h-12 mb-3"
                                        placeholder="Enter GST percentage"
                                        type="number"
                                        disabled={submitting || priceType === "order-wise"}
                                    />
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">GST Amount (₹)</Label>
                                    <Input
                                        value={gstAmount}
                                        onChange={(e) => handleGstAmountChange(e.target.value)}
                                        className="h-12"
                                        placeholder="Enter GST amount"
                                        type="number"
                                        disabled={submitting || priceType === "order-wise"}
                                    />
                                </div>

                                <p className="text-sm text-muted-foreground mt-2">
                                    {gstRate && gstAmount ? 
                                        `GST: ${gstRate}% = ₹${gstAmount}` : 
                                        "Enter either percentage or amount to calculate the other"}
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

                {/* STEP 2: STOCK SECTION */}
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

                {/* STEP 3: PRICE SECTION (UPDATED) */}
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

                            {/* GST INPUT - STEP 3 */}
                            {business?.gstApplicable && (
                                <div className="bg-card p-6 rounded-lg border">
                                    <Label className="font-bold text-lg">GST Rate/Amount *</Label>
                                    
                                    {/* Percentage Input */}
                                    <div className="mt-3">
                                        <Label className="text-sm font-medium mb-2 block">GST Percentage (%)</Label>
                                        <Input
                                            value={gstRate}
                                            onChange={(e) => handleGstRateChange(e.target.value)}
                                            className="h-12 mb-3"
                                            placeholder="Enter GST percentage"
                                            type="number"
                                            disabled={submitting || priceType === "order-wise"}
                                        />
                                    </div>

                                    {/* Amount Input */}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">GST Amount (₹)</Label>
                                        <Input
                                            value={gstAmount}
                                            onChange={(e) => handleGstAmountChange(e.target.value)}
                                            className="h-12"
                                            placeholder="Enter GST amount"
                                            type="number"
                                            disabled={submitting || priceType === "order-wise"}
                                        />
                                    </div>

                                    <p className="text-sm text-muted-foreground mt-2">
                                        {gstRate && gstAmount ? 
                                            `GST: ${gstRate}% = ₹${gstAmount}` : 
                                            "Enter either percentage or amount to calculate the other"}
                                    </p>
                                </div>
                            )}

                            {/* GST CALCULATION DISPLAY */}
                            {business?.gstApplicable && mrp && (
                                <div className="bg-card p-6 rounded-lg border">
                                    <Label className="font-bold text-lg">GST Calculation</Label>
                                    <div className="mt-3 space-y-2">
                                        <div className="flex justify-between">
                                            <span>Base Price (MRP):</span>
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

                            {/* DISCOUNT INPUT */}
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Discount</Label>
                                
                                {/* Percentage Input */}
                                <div className="mt-3">
                                    <Label className="text-sm font-medium mb-2 block">Discount Percentage (%)</Label>
                                    <Input
                                        disabled={priceType === "order-wise" || submitting}
                                        value={discount}
                                        onChange={(e) => handleDiscountChange(e.target.value)}
                                        className="h-12 mb-3"
                                        placeholder="Enter discount percentage"
                                        type="number"
                                    />
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Discount Amount (₹)</Label>
                                    <Input
                                        disabled={priceType === "order-wise" || submitting}
                                        value={discountAmount}
                                        onChange={(e) => handleDiscountAmountChange(e.target.value)}
                                        className="h-12"
                                        placeholder="Enter discount amount"
                                        type="number"
                                    />
                                </div>

                                <p className="text-sm text-muted-foreground mt-2">
                                    {discount && discountAmount ? 
                                        `Discount: ${discount}% = ₹${discountAmount}` : 
                                        "Enter either percentage or amount to calculate the other"}
                                </p>
                            </div>

                            {/* AFTER DISCOUNT / FINAL SALE PRICE */}
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Final Sale Price (Customer Pays)</Label>
                                <Input
                                    disabled
                                    value={afterDiscount}
                                    className="mt-3 h-12 bg-muted text-lg font-bold"
                                />
                            </div>

                            {/* FINAL AMOUNT YOU GET */}
                            <div className="bg-card p-6 rounded-lg border">
                                <Label className="font-bold text-lg">Amount You Receive (Before Admin Commission)</Label>
                                <Input
                                    disabled
                                    value={finalAmount}
                                    className="mt-3 h-12 bg-muted text-lg font-bold text-green-600"
                                />
                                <blockquote className="mt-4 text-sm text-muted-foreground border-l-4 pl-4 border-yellow-500 bg-yellow-50">
                                    **Important Note:** The displayed **Amount You Receive** is before the final **Admin Commission** is applied. The Admin will review the product details and set the commission/final approval before the product goes live.
                                </blockquote>
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
                                "SUBMIT FOR APPROVAL"
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default Addproduct;