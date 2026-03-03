import { useState, useEffect, useMemo } from "react";
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
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [addingSubcategory, setAddingSubcategory] = useState(false);

  // ITEM TYPE (product / service)
  const [itemType, setItemType] = useState("product");

  // PRICE TYPE (product-wise / order-wise)
  const [priceType, setPriceType] = useState("product-wise");

  // MRP TYPE (with-gst / without-gst)
  const [mrpType, setMrpType] = useState("without-gst");

  // Categories
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");

  // PRODUCT DETAILS
  const [itemName, setItemName] = useState("");
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
  const [mrp, setMrp] = useState("");                // base price if without-gst; full price if with-gst
  const [gstRate, setGstRate] = useState("");        // only used when mrpType=without-gst and gstApplicable
  const [gstAmount, setGstAmount] = useState("");    // only used when mrpType=without-gst and gstApplicable
  const [discount, setDiscount] = useState("");      // %
  const [discountAmount, setDiscountAmount] = useState(""); // ₹
  const [afterDiscount, setAfterDiscount] = useState("");  // final customer pays
  const [finalAmount, setFinalAmount] = useState("");      // before admin commission (same as afterDiscount)

  // ✅ NEW: Fulfillment
  const [fulfillmentMode, setFulfillmentMode] = useState("delivery_only"); // delivery_only | pickup_only | both
  const pickupEnabled = fulfillmentMode === "pickup_only" || fulfillmentMode === "both";
  const deliveryEnabled = fulfillmentMode === "delivery_only" || fulfillmentMode === "both";
  const [pickupPincodeMatchOnly, setPickupPincodeMatchOnly] = useState(true);

  // ✅ NEW: Pre-order
  const [preOrderEnabled, setPreOrderEnabled] = useState(false);
  const [preOrderAvailableFrom, setPreOrderAvailableFrom] = useState("");
  const [preOrderExpectedDispatchDays, setPreOrderExpectedDispatchDays] = useState("");
  const [preOrderMaxQtyPerUser, setPreOrderMaxQtyPerUser] = useState("");
  const [preOrderNote, setPreOrderNote] = useState("");

  // ✅ NEW: Availability rules
  const [blockIfOutOfStock, setBlockIfOutOfStock] = useState(true);
  const [allowPreOrderWhenOutOfStock, setAllowPreOrderWhenOutOfStock] = useState(true);

  const isService = itemType === "service";
  const gstApplicable = Boolean(business?.gstApplicable);

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  /* ---------------- FETCH BUSINESS ---------------- */
  useEffect(() => {
    if (!vendorId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`https://api.apexbee.in/api/business/get-business/${vendorId}`);
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

  /* ---------------- POPULATE SUBCATEGORIES ---------------- */
  useEffect(() => {
    setSubcategory("");
    const selectedCategory = categories.find((cat) => cat._id === category);
    if (selectedCategory?.subcategories) setSubcategories(selectedCategory.subcategories);
    else setSubcategories([]);
  }, [category, categories]);

  /* ---------------- ADD SUBCATEGORY ---------------- */
  const addNewSubcategory = async () => {
    const subName = newSubcategory.trim();
    if (!subName || !category) {
      alert("Please select a category and enter a subcategory name.");
      return;
    }

    setAddingSubcategory(true);
    try {
      const res = await axios.post(`https://api.apexbee.in/api/categories/${category}/subcategories`, {
        name: subName,
      });

      setCategories((prev) =>
        prev.map((cat) => (cat._id === category ? res.data.updatedCategory : cat))
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

  /* ---------------- IMAGE HANDLER ---------------- */
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const copy = [...prev];
      const url = copy[index];
      if (url) URL.revokeObjectURL(url);
      copy.splice(index, 1);
      return copy;
    });
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

  /* ======================================================
     ✅ PRICE LOGIC (Correct)
     - without-gst + gstApplicable => totalWithGst = mrp + gstAmount
     - with-gst => totalWithGst = mrp
     - discount always applies on totalWithGst (customer-facing price)
     - afterDiscount = totalWithGst - discountAmount
  ====================================================== */

  // When mrpType changes, reset gst fields if needed
  useEffect(() => {
    if (mrpType === "with-gst") {
      setGstRate("");
      setGstAmount("");
    }
  }, [mrpType]);

  // Handle GST rate change (only for without-gst + gstApplicable)
  const handleGstRateChange = (value) => {
    setGstRate(value);
    const base = toNum(mrp);
    const rate = toNum(value);
    if (!base || !rate || mrpType !== "without-gst" || !gstApplicable || priceType === "order-wise") {
      setGstAmount("");
      return;
    }
    const amt = (base * rate) / 100;
    setGstAmount(amt.toFixed(2));
  };

  // Handle GST amount change (only for without-gst + gstApplicable)
  const handleGstAmountChange = (value) => {
    setGstAmount(value);
    const base = toNum(mrp);
    const amt = toNum(value);
    if (!base || !amt || mrpType !== "without-gst" || !gstApplicable || priceType === "order-wise") {
      setGstRate("");
      return;
    }
    const rate = (amt / base) * 100;
    setGstRate(rate.toFixed(2));
  };

  // Discount % change => compute discountAmount based on totalWithGst
  const handleDiscountChange = (value) => {
    setDiscount(value);

    const perc = toNum(value);
    const base = toNum(mrp);
    if (!base || !perc || priceType === "order-wise") {
      if (value === "") setDiscountAmount("");
      return;
    }

    const totalWithGst =
      mrpType === "without-gst" && gstApplicable ? base + toNum(gstAmount) : base;

    const amt = (totalWithGst * perc) / 100;
    setDiscountAmount(amt.toFixed(2));
  };

  // Discount amount change => compute discount % based on totalWithGst
  const handleDiscountAmountChange = (value) => {
    setDiscountAmount(value);

    const amt = toNum(value);
    const base = toNum(mrp);
    if (!base || priceType === "order-wise") {
      if (value === "") setDiscount("");
      return;
    }

    const totalWithGst =
      mrpType === "without-gst" && gstApplicable ? base + toNum(gstAmount) : base;

    if (!totalWithGst) {
      setDiscount("");
      return;
    }

    const perc = (amt / totalWithGst) * 100;
    setDiscount(amt ? perc.toFixed(2) : "");
  };

  // Recalculate afterDiscount / finalAmount whenever price inputs change
  useEffect(() => {
    if (priceType === "order-wise") {
      setAfterDiscount("");
      setFinalAmount("");
      return;
    }

    const base = toNum(mrp);
    if (!base) {
      setAfterDiscount("");
      setFinalAmount("");
      return;
    }

    const totalWithGst =
      mrpType === "without-gst" && gstApplicable ? base + toNum(gstAmount) : base;

    const discAmt = toNum(discountAmount);
    const final = Math.max(0, totalWithGst - discAmt);

    setAfterDiscount(final.toFixed(2));
    setFinalAmount(final.toFixed(2));
  }, [mrp, gstAmount, discountAmount, mrpType, gstApplicable, priceType]);

  // If MRP changes: keep GST amount in sync if GST rate exists
  useEffect(() => {
    if (priceType === "order-wise") return;

    const base = toNum(mrp);
    if (!base) {
      if (mrpType === "without-gst") {
        setGstAmount("");
        setGstRate("");
      }
      setDiscount("");
      setDiscountAmount("");
      return;
    }

    // If without-gst, gst applicable, and gstRate exists => recompute gstAmount
    if (mrpType === "without-gst" && gstApplicable && gstRate) {
      const rate = toNum(gstRate);
      const amt = (base * rate) / 100;
      setGstAmount(amt.toFixed(2));
    }

    // If discount % exists => recompute discountAmount
    if (discount) {
      const totalWithGst =
        mrpType === "without-gst" && gstApplicable ? base + toNum(gstAmount) : base;
      const perc = toNum(discount);
      const amt = (totalWithGst * perc) / 100;
      setDiscountAmount(amt.toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mrp]);

  /* ---------------- STEP NAVIGATION ---------------- */
  const nextStep = () => {
    if (currentStep === 1 && (!category || !itemName)) {
      alert("Please fill required fields (Category & Item Name).");
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  /* ---------------- SUBMIT HANDLER ---------------- */
  const handleSubmit = async () => {
    if (!category || !itemName) {
      alert("Please fill required fields (Category & Item Name).");
      return;
    }

    if (preOrderEnabled && !preOrderAvailableFrom) {
      alert("Pre-order enabled: Please select Available From date.");
      return;
    }

    // If pickup enabled & business missing pincode => warn
    if (pickupEnabled && !business?.pinCode) {
      alert("Pickup enabled but your Business pinCode is missing. Please update business profile.");
      return;
    }

    setSubmitting(true);

    const fd = new FormData();

    fd.append("vendorId", vendorId);
    fd.append("itemType", itemType);

    fd.append("category", category);
    fd.append("subcategory", subcategory);

    fd.append("itemName", itemName);
    fd.append("description", description || "");

    // Stock fields only for product
    fd.append("measuringUnit", isService ? "" : measuringUnit);
    fd.append("hsnCode", isService ? "" : hsnCode);
    fd.append("godown", isService ? "" : godown);
    fd.append("openStock", isService ? "0" : String(openStock || 0));
    fd.append("asOnDate", isService ? "" : asOnDate);

    // Pricing
    fd.append("priceType", priceType);
    fd.append("mrpType", mrpType);

    fd.append("mrp", mrp || "");
    fd.append("gstRate", mrpType === "without-gst" ? (gstRate || "") : "");
    fd.append("gstAmount", mrpType === "without-gst" ? (gstAmount || "") : "");

    fd.append("discount", discount || "");
    fd.append("discountAmount", discountAmount || "");

    fd.append("afterDiscount", afterDiscount || "");
    fd.append("finalAmount", finalAmount || "");

    // ✅ Fulfillment
    fd.append("fulfillmentMode", fulfillmentMode);
    fd.append("pickupEnabled", String(pickupEnabled));
    fd.append("deliveryEnabled", String(deliveryEnabled));
    fd.append("pickupPincodeMatchOnly", String(pickupPincodeMatchOnly));

    // ✅ Pre-order
    fd.append("preOrderEnabled", String(preOrderEnabled));
    fd.append("preOrderAvailableFrom", preOrderAvailableFrom || "");
    fd.append("preOrderExpectedDispatchDays", String(preOrderExpectedDispatchDays || 0));
    fd.append("preOrderMaxQtyPerUser", String(preOrderMaxQtyPerUser || 0));
    fd.append("preOrderNote", preOrderNote || "");

    // ✅ Availability
    fd.append("blockIfOutOfStock", String(blockIfOutOfStock));
    fd.append("allowPreOrderWhenOutOfStock", String(allowPreOrderWhenOutOfStock));

    // images
    images.forEach((img) => fd.append("images", img));

    try {
      await axios.post("https://api.apexbee.in/api/products/add-product", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Product Added Successfully!");
      navigate("/products");
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI HELPERS ---------------- */
  const LoadingSpinner = ({ size = "default" }) => (
    <div className={`flex items-center justify-center ${size === "sm" ? "py-1" : "py-4"}`}>
      <div
        className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${
          size === "sm" ? "w-4 h-4" : "w-6 h-6"
        }`}
      />
    </div>
  );

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-2">
      <div className="bg-gray-200 h-4 rounded w-3/4" />
      <div className="bg-gray-200 h-10 rounded w-full" />
    </div>
  );

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
            {step < 3 && <div className={`w-16 h-1 ${currentStep > step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>
    </div>
  );

  const totalWithGst = useMemo(() => {
    const base = toNum(mrp);
    if (!base) return 0;
    if (priceType === "order-wise") return 0;
    if (mrpType === "without-gst" && gstApplicable) return base + toNum(gstAmount);
    return base; // with-gst
  }, [mrp, gstAmount, mrpType, gstApplicable, priceType]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-5 pb-10">
        <StepIndicator />

        {/* LOADING OVERLAY */}
        {loading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-semibold">Loading product form...</p>
            </div>
          </div>
        )}

        {/* ================= STEP 1 ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Product Details</h2>

            {/* ITEM TYPE */}
            <div className="bg-card p-6 rounded-lg border">
              <Label className="font-semibold text-lg">Item Type</Label>
              <RadioGroup value={itemType} onValueChange={setItemType} className="flex gap-6 mt-3">
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

            {/* ✅ Fulfillment */}
            <div className="bg-card p-6 rounded-lg border">
              <Label className="font-bold text-lg">Fulfillment (Delivery / Pickup)</Label>
              <RadioGroup value={fulfillmentMode} onValueChange={setFulfillmentMode} className="flex gap-6 mt-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery_only" id="delivery_only" />
                  <Label htmlFor="delivery_only">Delivery Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup_only" id="pickup_only" />
                  <Label htmlFor="pickup_only">Pickup Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Both</Label>
                </div>
              </RadioGroup>

              {pickupEnabled && (
                <div className="mt-4 p-4 rounded-lg bg-muted/40 border">
                  <Label className="font-semibold">Pickup Rule</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={pickupPincodeMatchOnly}
                      onChange={(e) => setPickupPincodeMatchOnly(e.target.checked)}
                      disabled={submitting}
                    />
                    <span className="text-sm">
                      Allow pickup only if User Pincode == Shop Pincode
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Shop pincode is from Business pinCode: <b>{business?.pinCode || "-"}</b>
                  </p>
                </div>
              )}
            </div>

            {/* ✅ Preorder */}
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-lg">Pre-Order</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preOrderEnabled}
                    onChange={(e) => setPreOrderEnabled(e.target.checked)}
                    disabled={submitting}
                  />
                  <span className="text-sm font-medium">Enable</span>
                </div>
              </div>

              {preOrderEnabled && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Available From *</Label>
                    <Input
                      type="date"
                      value={preOrderAvailableFrom}
                      onChange={(e) => setPreOrderAvailableFrom(e.target.value)}
                      className="mt-2 h-12"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Expected Dispatch Days</Label>
                    <Input
                      type="number"
                      value={preOrderExpectedDispatchDays}
                      onChange={(e) => setPreOrderExpectedDispatchDays(e.target.value)}
                      className="mt-2 h-12"
                      placeholder="e.g. 3"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Max Qty Per User</Label>
                    <Input
                      type="number"
                      value={preOrderMaxQtyPerUser}
                      onChange={(e) => setPreOrderMaxQtyPerUser(e.target.value)}
                      className="mt-2 h-12"
                      placeholder="0 = unlimited"
                      disabled={submitting}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Note (Shown to user)</Label>
                    <Textarea
                      value={preOrderNote}
                      onChange={(e) => setPreOrderNote(e.target.value)}
                      className="mt-2 min-h-[80px]"
                      placeholder="This is a pre-order item..."
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Availability */}
            <div className="bg-card p-6 rounded-lg border">
              <Label className="font-bold text-lg">Availability Rules</Label>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={blockIfOutOfStock}
                    onChange={(e) => setBlockIfOutOfStock(e.target.checked)}
                    disabled={submitting}
                  />
                  Block checkout when stock is 0 (normal purchase)
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={allowPreOrderWhenOutOfStock}
                    onChange={(e) => setAllowPreOrderWhenOutOfStock(e.target.checked)}
                    disabled={submitting || !preOrderEnabled}
                  />
                  Allow Pre-Order when stock is 0
                </label>

                {!preOrderEnabled && (
                  <p className="text-xs text-muted-foreground">
                    Enable Pre-Order to allow “Pre-Order when out of stock”.
                  </p>
                )}
              </div>
            </div>

            {/* CATEGORY */}
            <div className="bg-card p-6 rounded-lg border">
              <Label className="font-bold text-lg">Category *</Label>
              {categoriesLoading ? (
                <SkeletonLoader />
              ) : (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-3 h-12">
                    <SelectValue placeholder="Select Category" />
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

            {/* IMAGES */}
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
                <label htmlFor="image-upload" className={`cursor-pointer block ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xl">🖼️</span>
                    </div>
                    <p className="text-lg font-medium">Click to upload images</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG, JPEG up to 10MB</p>
                  </div>
                </label>
              </div>

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

        {/* ================= STEP 2 (Only for product) ================= */}
        {currentStep === 2 && itemType === "product" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Stock Details</h2>

            <div className="bg-card p-6 rounded-lg border">
              <Label className="font-bold text-lg">SKU Code (Auto Generated)</Label>
              <Input value={previewSKU()} readOnly className="mt-3 h-12 bg-muted" />
              <p className="text-sm text-muted-foreground mt-2">Final SKU will be generated automatically after saving.</p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <Label className="font-bold text-lg">Measuring Unit *</Label>
              <div className="flex gap-3 items-center mt-3">
                <Select value={measuringUnit} onValueChange={setMeasuringUnit} disabled={submitting}>
                  <SelectTrigger className="flex-1 h-12">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitList.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
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

            <div className="bg-card p-6 rounded-lg border">
              <Label className="font-bold text-lg">Godown / Shop *</Label>
              <div className="flex gap-3 items-center mt-3">
                <Select value={godown} onValueChange={setGodown} disabled={submitting}>
                  <SelectTrigger className="flex-1 h-12">
                    <SelectValue placeholder="Select Godown / Shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {godownList.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
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

        {/* ================= STEP 2 for service: skip stock and jump to step 3 ================= */}
        {currentStep === 2 && itemType === "service" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Service Info</h2>
            <div className="bg-card p-6 rounded-lg border">
              <p className="text-muted-foreground">
                Stock section is not required for services. Click <b>Next Step</b> to continue.
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 3 (FULL PRICE SECTION + Correct) ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Price Details</h2>

            {/* PRICE TYPE */}
            <div className="bg-card p-6 rounded-lg border">
              <Label className="font-bold text-lg mb-4 block">PRICE TYPE</Label>

              <div className="flex flex-col sm:flex-row gap-4">
                <div
                  className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    priceType === "product-wise" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                  } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
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
                    Set individual prices for this product/service
                  </p>
                </div>

                <div
                  className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    priceType === "order-wise" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                  } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
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
                    Prices vary by quantity (you can implement later)
                  </p>
                </div>
              </div>
            </div>

            {/* If order-wise: show info */}
            {priceType === "order-wise" ? (
              <div className="bg-card p-6 rounded-lg border">
                <Label className="font-bold text-lg">Order-wise Pricing</Label>
                <p className="text-sm text-muted-foreground mt-2">
                  You selected order-wise pricing. For now, backend can keep this product as order-wise and you can add
                  slabs/tiers later. Switch to <b>product-wise</b> to set normal prices.
                </p>
              </div>
            ) : (
              <>
                {/* MRP TYPE + MRP INPUT */}
                <div className="bg-card p-6 rounded-lg border">
                  <Label className="font-bold text-lg">
                    {mrpType === "with-gst" ? "MRP (Price includes GST)" : "MRP (Price excludes GST)"} *
                  </Label>

                  <div className="mt-3 mb-4">
                    <Label className="text-sm font-medium mb-2 block">Select MRP Type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="without-gst"
                          checked={mrpType === "without-gst"}
                          onChange={() => setMrpType("without-gst")}
                          className="w-4 h-4"
                          disabled={submitting}
                        />
                        <span>Without GST</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="with-gst"
                          checked={mrpType === "with-gst"}
                          onChange={() => setMrpType("with-gst")}
                          className="w-4 h-4"
                          disabled={submitting}
                        />
                        <span>With GST</span>
                      </label>
                    </div>

                    {gstApplicable ? (
                      <p className="text-sm text-muted-foreground mt-2">
                        {mrpType === "without-gst"
                          ? "GST will be added on top of base price."
                          : "GST is already included in price."}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        GST is not applicable for this business. Only MRP will be used.
                      </p>
                    )}
                  </div>

                  <Input
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="h-12"
                    placeholder="0.00"
                    type="number"
                    disabled={submitting}
                  />
                </div>

                {/* GST Section (only if business gstApplicable and mrpType is without-gst) */}
                {gstApplicable && mrpType === "without-gst" && (
                  <div className="bg-card p-6 rounded-lg border">
                    <Label className="font-bold text-lg">GST Rate / Amount *</Label>

                    <div className="mt-3">
                      <Label className="text-sm font-medium mb-2 block">GST Percentage (%)</Label>
                      <Input
                        value={gstRate}
                        onChange={(e) => handleGstRateChange(e.target.value)}
                        className="h-12 mb-3"
                        placeholder="e.g. 5, 12, 18"
                        type="number"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">GST Amount (₹)</Label>
                      <Input
                        value={gstAmount}
                        onChange={(e) => handleGstAmountChange(e.target.value)}
                        className="h-12"
                        placeholder="GST amount auto-calculated"
                        type="number"
                        disabled={submitting}
                      />
                    </div>

                    <p className="text-sm text-muted-foreground mt-2">
                      {gstRate && gstAmount ? `GST: ${gstRate}% = ₹${gstAmount}` : "Enter either % or ₹ to calculate the other"}
                    </p>
                  </div>
                )}

                {/* GST Calculation Display */}
                {gstApplicable && mrpType === "without-gst" && mrp && (
                  <div className="bg-card p-6 rounded-lg border">
                    <Label className="font-bold text-lg">Price Breakdown</Label>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>₹{toNum(mrp).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST:</span>
                        <span>₹{toNum(gstAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total (With GST):</span>
                        <span>₹{totalWithGst.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Discount */}
                <div className="bg-card p-6 rounded-lg border">
                  <Label className="font-bold text-lg">Discount</Label>

                  <div className="mt-3">
                    <Label className="text-sm font-medium mb-2 block">Discount Amount (₹)</Label>
                    <Input
                      value={discountAmount}
                      onChange={(e) => handleDiscountAmountChange(e.target.value)}
                      className="h-12 mb-3"
                      placeholder="Enter discount in rupees"
                      type="number"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Discount Percentage (%)</Label>
                    <Input
                      value={discount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="h-12"
                      placeholder="Enter discount percentage"
                      type="number"
                      disabled={submitting}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">
                    {discount && discountAmount
                      ? `Discount: ${discount}% = ₹${discountAmount}`
                      : "Enter either % or ₹ to calculate the other"}
                  </p>
                </div>

                {/* Customer Pays */}
                <div className="bg-card p-6 rounded-lg border">
                  <Label className="font-bold text-lg">Final Sale Price (Customer Pays)</Label>
                  <Input
                    disabled
                    value={afterDiscount}
                    className="mt-3 h-12 bg-muted text-lg font-bold"
                  />

                  <div className="mt-3 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Total (With GST):</span>
                      <span>₹{totalWithGst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{toNum(discountAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Customer Pays:</span>
                      <span>₹{toNum(afterDiscount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Vendor Receives */}
                <div className="bg-card p-6 rounded-lg border">
                  <Label className="font-bold text-lg">Amount You Receive (Before Admin Commission)</Label>
                  <Input
                    disabled
                    value={finalAmount}
                    className="mt-3 h-12 bg-muted text-lg font-bold text-green-600"
                  />
                  <blockquote className="mt-4 text-sm text-muted-foreground border-l-4 pl-4 border-yellow-500 bg-yellow-50">
                    Important: This is before Admin Commission is applied.
                  </blockquote>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= NAV BUTTONS ================= */}
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
            <Button onClick={nextStep} disabled={submitting} className="px-8 py-3">
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
