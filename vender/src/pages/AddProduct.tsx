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

  const [activeSection, setActiveSection] = useState("product");
  const [business, setBusiness] = useState(null);

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

  // PRODUCT DETAILS
  const [itemName, setItemName] = useState("");
  const [salesPrice, setSalesPrice] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);

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

  /* ---------------- FETCH BUSINESS ---------------- */
  useEffect(() => {
    if (!vendorId) return;
    const load = async () => {
      try {
        const res = await axios.get(
          `https://api.apexbee.in/api/business/get-business/${vendorId}`
        );
        setBusiness(res.data.business);
      } catch (err) {
        console.error(err);
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
    axios
      .get("https://api.apexbee.in/api/categories")
      .then((res) => setCategories(res.data.categories || []))
      .catch(console.error);
  }, []);

  /* ---------------- FETCH SUBCATEGORIES ---------------- */
  useEffect(() => {
    if (!category) {
      setSubcategories([]);
      setSubcategory("");
      return;
    }
    axios
      .get(`https://api.apexbee.in/api/subcategories/${category}`)
      .then((res) => setSubcategories(res.data.subcategories || []))
      .catch(console.error);
  }, [category]);

  /* ---------------- PRICE CALCULATIONS ---------------- */
  useEffect(() => {
    if (priceType === "order-wise") {
      setAfterDiscount("");
      setFinalAmount("");
      return;
    }

    const basePrice = mrp || salesPrice;
    if (!basePrice) {
      setAfterDiscount("");
      setFinalAmount("");
      return;
    }

    const pBase = Number(basePrice) || 0;
    const pDiscount = Number(discount) || 0;
    const ad = pBase - (pBase * pDiscount) / 100;
    setAfterDiscount(isNaN(ad) ? "" : ad.toFixed(2));

    const final = ad - commission;
    setFinalAmount(isNaN(final) ? "" : final.toFixed(2));
  }, [mrp, salesPrice, discount, priceType, commission]);

  /* ---------------- IMAGE HANDLER ---------------- */
  const handleImageUpload = (e) => {
    setImages([...e.target.files]);
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

  /* ---------------- SUBMIT HANDLER ---------------- */
  const handleSubmit = async () => {
    if (!category || !itemName) {
      alert("Please fill required fields (Category & Item Name).");
      return;
    }

    const fd = new FormData();

    fd.append("vendorId", vendorId);
    fd.append("itemType", itemType);
    fd.append("category", category);
    fd.append("subcategory", subcategory);
    fd.append("itemName", itemName);
    fd.append("salesPrice", salesPrice || "");
    fd.append("gstRate", gstRate || "");
    fd.append("description", description || "");

    /* ❌ DON’T SEND SKU — Backend will generate automatically */

    fd.append("measuringUnit", itemType === "Service" ? "" : measuringUnit);
    fd.append("hsnCode", itemType === "Service" ? "" : hsnCode);
    fd.append("godown", itemType === "Service" ? "" : godown);
    fd.append("openStock", itemType === "Service" ? 0 : openStock);
    fd.append("asOnDate", itemType === "Service" ? "" : asOnDate);

    fd.append("mrp", mrp || salesPrice || "");
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

      alert(
        `Product Added Successfully!`
      );
      navigate("/products");  


      
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-5 pb-10">
        {/* SECTION TABS */}
        <div className="flex justify-center gap-4 my-6">
          {["product", "stock", "price"].map((id) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`px-4 py-2 rounded font-semibold ${
                activeSection === id
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {id.toUpperCase()} DETAILS
            </button>
          ))}
        </div>

        {/* ---------------- PRODUCT DETAILS ---------------- */}
        {activeSection === "product" && (
          <div className="space-y-6">
            {/* ITEM TYPE */}
            <div>
              <Label className="font-semibold">Item Type</Label>
              <RadioGroup
                value={itemType}
                onValueChange={(value) => setItemType(value)}
                className="flex gap-6 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="product" id="product" />
                  <Label htmlFor="product">Product</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="service" id="service" />
                  <Label htmlFor="service">Service</Label>
                </div>
              </RadioGroup>
            </div>

            {/* CATEGORY */}
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

            {/* SUBCATEGORY */}
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

            {/* ITEM NAME & SALES PRICE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-bold">Item Name *</Label>
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div>
                <Label className="font-bold">
                  Sales Price {business?.gstApplicable ? "(Without GST)" : ""}
                </Label>
                <Input
                  value={salesPrice}
                  onChange={(e) => setSalesPrice(e.target.value)}
                />
              </div>
            </div>

            {/* GST */}
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

            {/* DESCRIPTION */}
            <div>
              <Label className="font-bold">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* IMAGES */}
            <div>
              <Label className="font-bold">Upload Images</Label>
              <input type="file" multiple onChange={handleImageUpload} />
            </div>
          </div>
        )}

        {/* ---------------- STOCK SECTION ---------------- */}
        {activeSection === "stock" && itemType === "product" && (
          <div className="space-y-6">
            {/* AUTO SKU PREVIEW */}
            <div>
              <Label className="font-bold">SKU Code (Auto Generated)</Label>
              <Input value={previewSKU()} readOnly />
              <p className="text-xs text-gray-500 mt-1">
                Final SKU will be generated automatically after saving.
              </p>
            </div>

            {/* MEASURING UNIT */}
            <div>
              <Label className="font-bold">Measuring Unit *</Label>
              <div className="flex gap-2 items-center">
                <Select
                  value={measuringUnit}
                  onValueChange={setMeasuringUnit}
                >
                  <SelectTrigger>
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
                          onChange={(e) =>
                            setCustomUnitInput(e.target.value)
                          }
                        />
                        <Button onClick={addMeasureUnit}>Add</Button>
                      </div>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* HSN */}
            <div>
              <Label className="font-bold">HSN Code</Label>
              <Input
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
              />
            </div>

            {/* GODOWN */}
            <div>
              <Label className="font-bold">Godown / Shop *</Label>
              <div className="flex gap-2 items-center">
                <Select value={godown} onValueChange={setGodown}>
                  <SelectTrigger>
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
                        />
                        <Button onClick={addGodown}>+ Add</Button>
                      </div>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* OPEN STOCK / DATE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-bold">Open Stock</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    value={openStock}
                    onChange={(e) => setOpenStock(e.target.value)}
                  />
                  <span className="px-3 py-2 bg-blue-100 rounded">
                    {measuringUnit}
                  </span>
                </div>
              </div>

              <div>
                <Label className="font-bold">As On Date</Label>
                <Input
                  type="date"
                  value={asOnDate}
                  onChange={(e) => setAsOnDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------- PRICE SECTION ---------------- */}
        {activeSection === "price" && (
          <div className="space-y-6">
            {/* PRICE TYPE */}
            <div className="flex gap-6 items-center">
              <Label className="font-bold text-lg">PRICE DETAILS</Label>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="product-wise"
                    checked={priceType === "product-wise"}
                    onChange={() => setPriceType("product-wise")}
                  />
                  Product Wise
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="order-wise"
                    checked={priceType === "order-wise"}
                    onChange={() => setPriceType("order-wise")}
                  />
                  Order Wise
                </label>
              </div>
            </div>

            {/* MRP */}
            <div>
              <Label className="font-bold">Maximum Retail Price (MRP)</Label>
              <Input
                disabled={priceType === "order-wise"}
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
              />
            </div>

            {/* DISCOUNT */}
            <div>
              <Label className="font-bold">Discount</Label>
              <div className="flex gap-2 items-center">
                <Input
                  disabled={priceType === "order-wise"}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
                <div className="px-3 py-2 bg-blue-100 rounded">%</div>
              </div>
            </div>

            {/* AFTER DISCOUNT */}
            <div>
              <Label className="font-bold">After Discount Sale Price</Label>
              <Input disabled value={afterDiscount} />
            </div>

            {/* COMMISSION */}
            <div>
              <Label className="font-bold">Apex Bee Commission</Label>
              <Input disabled value={commission} />
            </div>

            {/* FINAL AMOUNT */}
            <div>
              <Label className="font-bold">Final You Get Amount</Label>
              <Input disabled value={finalAmount} />
            </div>
          </div>
        )}

        {/* SAVE BUTTON */}
        <div className="flex justify-center mt-10">
          <Button className="px-10 py-4 text-lg" onClick={handleSubmit}>
            SAVE PRODUCT
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Addproduct;
