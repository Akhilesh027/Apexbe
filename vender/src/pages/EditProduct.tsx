import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axios from "axios";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activeSection, setActiveSection] = useState("product");

  // PRODUCT TYPE
  const [itemType, setItemType] = useState("product");

  // PRICE TYPE
  const [priceType, setPriceType] = useState("product-wise");

  // Categories
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");

  // Product details
  const [itemName, setItemName] = useState("");
  const [salesPrice, setSalesPrice] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [preview, setPreview] = useState<string[]>([]);

  // Stock
  const [skuCode, setSkuCode] = useState("APX-" + Date.now());
  const [measuringUnit, setMeasuringUnit] = useState("PCS");
  const [customUnitInput, setCustomUnitInput] = useState("");
  const [unitList, setUnitList] = useState(["PCS","KG","GMS","LTR","ML","BOX","BAG"]);
  const [hsnCode, setHsnCode] = useState("");
  const [godownList, setGodownList] = useState(["Main Godown"]);
  const [godown, setGodown] = useState("");
  const [newGodown, setNewGodown] = useState("");
  const [openStock, setOpenStock] = useState("");
  const [asOnDate, setAsOnDate] = useState("");

  // Price details
  const [mrp, setMrp] = useState("");
  const [discount, setDiscount] = useState("");
  const [afterDiscount, setAfterDiscount] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [commission] = useState(20);

  const vendorId = localStorage.getItem("vendorId");

  // Fetch categories
  useEffect(() => {
    axios.get("https://api.apexbee.in/api/categories")
      .then(res => setCategories(res.data.categories || []))
      .catch(console.error);
  }, []);

  // Fetch subcategories on category change
  useEffect(() => {
    if (!category) return setSubcategories([]);
    axios.get(`https://api.apexbee.in/api/subcategories/${category}`)
      .then(res => setSubcategories(res.data.subcategories || []))
      .catch(console.error);
  }, [category]);

  // Fetch product data
  useEffect(() => {
  const fetchProduct = async () => {
    try {
      const res = await axios.get(`https://api.apexbee.in/api/product/${id}`);
      const product = res.data;

      if (product) {
        // Set all fields from the response
        setItemType(product.itemType);
        setCategory(product.category);
        setSubcategory(product.subcategory || "");
        setItemName(product.itemName);
        setSalesPrice(product.salesPrice);
        setGstRate(product.gstRate);
        setDescription(product.description);
        setImages(product.images || []);

        setSkuCode(product.skuCode);
        setMeasuringUnit(product.measuringUnit);
        setHsnCode(product.hsnCode);
        setGodown(product.godown);
        setOpenStock(product.openStock);
        setAsOnDate(product.asOnDate);

        setMrp(product.userPrice || product.salesPrice);
        setDiscount(product.discount || 0);
        setAfterDiscount(product.afterDiscount || "");
        setFinalAmount(product.finalAmount || "");
        setPriceType(product.priceType);
      }
    } catch (err) {
      console.error("Failed to fetch product details:", err);
    }
  };

  if (id) fetchProduct();
}, [id]);


  // Calculate price
  useEffect(() => {
    const basePrice = mrp || salesPrice;
    if (!basePrice) return;
    const pBase = Number(basePrice) || 0;
    const pDiscount = Number(discount) || 0;
    const ad = pBase - (pBase * pDiscount)/100;
    setAfterDiscount(isNaN(ad)? "" : ad.toFixed(2));
    const final = ad - commission;
    setFinalAmount(isNaN(final)? "" : final.toFixed(2));
  }, [mrp, salesPrice, discount]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setImages([...files]);
    setPreview(Array.from(files).map(f => URL.createObjectURL(f)));
  };

  const addGodown = () => {
    const v = (newGodown || "").trim();
    if (!v) return;
    if (!godownList.includes(v)) setGodownList([...godownList, v]);
    setGodown(v);
    setNewGodown("");
  };

  const addMeasureUnit = () => {
    const v = (customUnitInput || "").trim();
    if (!v) return;
    if (!unitList.includes(v)) setUnitList([...unitList, v]);
    setMeasuringUnit(v);
    setCustomUnitInput("");
  };

  const handleSubmit = async () => {
    if (!category || !itemName) {
      alert("Please fill required fields");
      return;
    }

    const fd = new FormData();
    fd.append("vendorId", vendorId || "");
    fd.append("itemType", itemType);
    fd.append("priceType", priceType);
    fd.append("category", category);
    fd.append("subcategory", subcategory);
    fd.append("itemName", itemName);
    fd.append("salesPrice", salesPrice);
    fd.append("gstRate", gstRate);
    fd.append("description", description);
    fd.append("skuCode", skuCode);
    fd.append("measuringUnit", itemType === "service"? "" : measuringUnit);
    fd.append("hsnCode", itemType === "service"? "" : hsnCode);
    fd.append("godown", itemType === "service"? "" : godown);
    fd.append("openStock", itemType === "service"? "0" : openStock);
    fd.append("asOnDate", itemType === "service"? "" : asOnDate);
    fd.append("mrp", mrp || salesPrice);
    fd.append("discount", discount);
    fd.append("afterDiscount", afterDiscount);
    fd.append("commission", commission.toString());
    fd.append("finalAmount", finalAmount);

    images.forEach(img => fd.append("images", img));

    try {
      const res = await axios.put(`https://api.apexbee.in/api/products/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        alert("Product updated successfully");
        navigate("/products");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update product");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-5 pb-10">
        {/* Tabs */}
        <div className="flex justify-center gap-4 my-6">
          {["product","stock","price"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className={`px-4 py-2 rounded font-semibold ${activeSection===tab ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
            >
              {tab.toUpperCase()} DETAILS
            </button>
          ))}
        </div>

        {/* ---------------- PRODUCT SECTION ---------------- */}
        {activeSection==="product" && (
          <div className="space-y-6">
            <div>
              <Label className="font-semibold">Item Type</Label>
              <RadioGroup value={itemType} onValueChange={setItemType} className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="product" id="product"/>
                  <Label htmlFor="product">Product</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="service" id="service"/>
                  <Label htmlFor="service">Service</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="font-bold">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select Category"/></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {subcategories.length>0 && (
              <div>
                <Label className="font-bold">Subcategory</Label>
                <Select value={subcategory} onValueChange={setSubcategory}>
                  <SelectTrigger><SelectValue placeholder="Select Subcategory"/></SelectTrigger>
                  <SelectContent>
                    {subcategories.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-bold">Item Name *</Label>
                <Input value={itemName} onChange={e=>setItemName(e.target.value)}/>
              </div>
              <div>
                <Label className="font-bold">Sales Price</Label>
                <Input value={salesPrice} onChange={e=>setSalesPrice(e.target.value)}/>
              </div>
            </div>

            <div>
              <Label className="font-bold">GST Rate</Label>
              <Select value={gstRate} onValueChange={setGstRate}>
                <SelectTrigger><SelectValue placeholder="Select GST %"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-bold">Description</Label>
              <Textarea value={description} onChange={e=>setDescription(e.target.value)}/>
            </div>

            <div>
              <Label className="font-bold">Upload Images</Label>
              <input type="file" multiple onChange={handleImageUpload}/>
              <div className="flex gap-2 mt-2">
                {preview.map((p,i)=>(
                  <img key={i} src={p} alt="preview" className="w-20 h-20 object-cover rounded"/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- STOCK SECTION ---------------- */}
        {activeSection==="stock" && itemType==="product" && (
          <div className="space-y-6">
            <div>
              <Label className="font-bold">SKU Code</Label>
              <Input value={skuCode} readOnly/>
            </div>

            <div>
              <Label className="font-bold">Measuring Unit *</Label>
              <div className="flex gap-2 items-center">
                <Select value={measuringUnit} onValueChange={setMeasuringUnit}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {unitList.map(u=><SelectItem key={u} value={u}>{u}</SelectItem>)}
                    <div className="p-2 border-t mt-1 flex gap-2">
                      <Input placeholder="Add custom unit" value={customUnitInput} onChange={e=>setCustomUnitInput(e.target.value)}/>
                      <Button onClick={addMeasureUnit}>Add</Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-bold">HSN Code</Label>
              <Input value={hsnCode} onChange={e=>setHsnCode(e.target.value)}/>
            </div>

            <div>
              <Label className="font-bold">Godown / Shop *</Label>
              <div className="flex gap-2 items-center">
                <Select value={godown} onValueChange={setGodown}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {godownList.map(g=><SelectItem key={g} value={g}>{g}</SelectItem>)}
                    <div className="p-2 border-t mt-1 flex gap-2">
                      <Input placeholder="Add Godown / Shop" value={newGodown} onChange={e=>setNewGodown(e.target.value)}/>
                      <Button onClick={addGodown}>+ Add</Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-bold">Open Stock</Label>
                <Input value={openStock} onChange={e=>setOpenStock(e.target.value)}/>
              </div>
              <div>
                <Label className="font-bold">As On Date</Label>
                <Input type="date" value={asOnDate} onChange={e=>setAsOnDate(e.target.value)}/>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- PRICE SECTION ---------------- */}
        {activeSection==="price" && (
          <div className="space-y-6">
            <div className="flex gap-6 items-center">
              <Label className="font-bold text-lg">PRICE DETAILS</Label>
              <div className="flex gap-4">
                <label><input type="radio" value="product-wise" checked={priceType==="product-wise"} onChange={()=>setPriceType("product-wise")}/> Product Wise</label>
                <label><input type="radio" value="order-wise" checked={priceType==="order-wise"} onChange={()=>setPriceType("order-wise")}/> Order Wise</label>
              </div>
            </div>

            <div>
              <Label className="font-bold">MRP</Label>
              <Input disabled={priceType==="order-wise"} value={mrp} onChange={e=>setMrp(e.target.value)}/>
            </div>

            <div>
              <Label className="font-bold">Discount %</Label>
              <Input disabled={priceType==="order-wise"} value={discount} onChange={e=>setDiscount(e.target.value)}/>
            </div>

            <div>
              <Label className="font-bold">After Discount</Label>
              <Input disabled value={afterDiscount}/>
            </div>

            <div>
              <Label className="font-bold">Apex Bee Commission</Label>
              <Input disabled value={commission}/>
            </div>

            <div>
              <Label className="font-bold">Final You Get Amount</Label>
              <Input disabled value={finalAmount}/>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-10">
          <Button className="px-10 py-4 text-lg" onClick={handleSubmit}>UPDATE PRODUCT</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default EditProduct;
