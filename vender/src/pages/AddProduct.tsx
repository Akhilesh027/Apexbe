import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";

const Addproduct = () => {
  const vendorId = localStorage.getItem("vendorId");

  const [activeSection, setActiveSection] = useState("product");
  const [business, setBusiness] = useState(null);

  // Categories & Subcategories
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");

  // PRODUCT DETAILS
  const [itemType, setItemType] = useState("product");
  const [itemName, setItemName] = useState("");
  const [salesPrice, setSalesPrice] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);

  // STOCK DETAILS
  const [skuCode] = useState("APX-" + Date.now());
  const [measuringUnit, setMeasuringUnit] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [godown, setGodown] = useState("");
  const [openStock, setOpenStock] = useState("");
  const [asOnDate, setAsOnDate] = useState("");

  // PRICE DETAILS
  const [mrp, setMrp] = useState("");
  const [discount, setDiscount] = useState("");
  const [afterDiscount, setAfterDiscount] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [commission] = useState(20);

  /* ---------------- FETCH BUSINESS DETAILS ---------------- */
  useEffect(() => {
    if (!vendorId) return;

    const fetchBusiness = async () => {
      try {
        const res = await axios.get(`https://api.apexbee.in/api/business/get-business/${vendorId}`);
        setBusiness(res.data.business);
      } catch (err) {
        console.error("Business Fetch Error:", err);
      }
    };

    fetchBusiness();
  }, [vendorId]);

  /* ---------------- FETCH CATEGORIES ---------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("https://api.apexbee.in/api/categories");
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    };
    fetchCategories();
  }, []);

  /* ---------------- FETCH SUBCATEGORIES ON CATEGORY CHANGE ---------------- */
  useEffect(() => {
    if (!category) {
      setSubcategories([]);
      setSubcategory("");
      return;
    }

    const fetchSubcategories = async () => {
      try {
        const res = await axios.get(`https://api.apexbee.in/api/subcategories/${category}`);
        setSubcategories(res.data.subcategories || []);
        setSubcategory(""); // Reset subcategory when category changes
      } catch (err) {
        console.error("Subcategory fetch error:", err);
      }
    };

    fetchSubcategories();
  }, [category]);

  /* ---------------- AUTO PRICE CALCULATIONS ---------------- */
  useEffect(() => {
    if (!mrp || !discount) return;
    const ad = Number(mrp) - (Number(mrp) * Number(discount)) / 100;
    setAfterDiscount(ad.toFixed(2));
    const final = ad - commission;
    setFinalAmount(final.toFixed(2));
  }, [mrp, discount]);

  /* ---------------- IMAGE HANDLER ---------------- */
  const handleImageUpload = (e) => {
    setImages([...e.target.files]);
  };

  /* ---------------- SUBMIT HANDLER ---------------- */
  const handleSubmit = async () => {
    if (!vendorId) {
      alert("Vendor ID missing.");
      return;
    }

    if (!category || !itemName || !mrp) {
      alert("Please fill required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("vendorId", vendorId);
    formData.append("itemType", itemType);
    formData.append("category", category);
    formData.append("subcategory", subcategory);
    formData.append("itemName", itemName);
    formData.append("salesPrice", salesPrice);
    business?.gstApplicable && formData.append("gstRate", gstRate);
    formData.append("description", description);
    formData.append("skuCode", skuCode);
    formData.append("measuringUnit", measuringUnit);
    formData.append("hsnCode", hsnCode);
    formData.append("godown", godown);
    formData.append("openStock", openStock);
    formData.append("asOnDate", asOnDate);
    formData.append("mrp", mrp);
    formData.append("discount", discount);
    formData.append("afterDiscount", afterDiscount);
    formData.append("commission", commission);
    formData.append("finalAmount", finalAmount);

    images.forEach((img) => formData.append("images", img));

    try {
      await axios.post("https://api.apexbee.in/api/products/add-product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Product Added Successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    }
  };

  /* ---------------- UI ---------------- */
  const sections = [
    { id: "product", label: "PRODUCT DETAILS" },
    { id: "stock", label: "STOCK DETAILS" },
    { id: "price", label: "PRICE DETAILS" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* SECTION SWITCH */}
        <div className="flex justify-center gap-4 mb-6 mt-4">
          {sections.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded ${
                activeSection === tab.id
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PRODUCT SECTION */}
        {activeSection === "product" && (
          <div className="space-y-6">
            <div>
              <Label className="font-bold">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
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
            </div>

            {subcategories.length > 0 && (
              <div>
                <Label className="font-bold">Subcategory</Label>
                <Select value={subcategory} onValueChange={setSubcategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub._id} value={sub._id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-bold">Item Name *</Label>
                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </div>
              <div>
                <Label className="font-bold">
                  Sales Price {business?.gstApplicable ? "(Without GST)" : ""}
                </Label>
                <Input value={salesPrice} onChange={(e) => setSalesPrice(e.target.value)} />
              </div>
            </div>

            {business?.gstApplicable && (
              <div>
                <Label className="font-bold">GST Rate *</Label>
                <Select value={gstRate} onValueChange={setGstRate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST %" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="font-bold">Description *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <Label className="font-bold">Upload Images *</Label>
              <input type="file" multiple onChange={handleImageUpload} />
            </div>
          </div>
        )}

        {/* STOCK SECTION */}
        {activeSection === "stock" && (
          <div className="space-y-6">
            <div>
              <Label className="font-bold">SKU Code</Label>
              <Input value={skuCode} readOnly />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Measuring Unit</Label>
                <Input value={measuringUnit} onChange={(e) => setMeasuringUnit(e.target.value)} />
              </div>
              <div>
                <Label>HSN Code</Label>
                <Input value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="font-bold">Godown / Shop</Label>
              <Select value={godown} onValueChange={setGodown}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={business?.businessName}>{business?.businessName}</SelectItem>
                  <SelectItem value="Main Godown">Main Godown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Open Stock</Label>
                <Input value={openStock} onChange={(e) => setOpenStock(e.target.value)} />
              </div>
              <div>
                <Label>As On Date</Label>
                <Input type="date" value={asOnDate} onChange={(e) => setAsOnDate(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* PRICE SECTION */}
        {activeSection === "price" && (
          <div className="space-y-6">
            <div>
              <Label className="font-bold">M.R.P</Label>
              <Input value={mrp} onChange={(e) => setMrp(e.target.value)} />
            </div>

            <div>
              <Label className="font-bold">Discount (%)</Label>
              <Input value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>

            <div>
              <Label className="font-bold">After Discount Price</Label>
              <Input value={afterDiscount} readOnly />
            </div>

            <div>
              <Label className="font-bold">Commission (APEXBEE)</Label>
              <Input value={commission} readOnly />
            </div>

            <div>
              <Label className="font-bold">Final Amount Vendor Gets</Label>
              <Input value={finalAmount} readOnly />
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Button className="px-10 py-4 text-lg" onClick={handleSubmit}>
            SAVE PRODUCT
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Addproduct;
