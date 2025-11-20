import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const AddProduct = () => {
  const navigate = useNavigate();

  // ----------------------------------------
  // STATES
  // ----------------------------------------
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    category: "",
    subcategory: "",
    stock: "",
    description: "",
    image: null as File | null,
  });

  const [preview, setPreview] = useState<string>("");

  // ----------------------------------------
  // SKU GENERATOR FUNCTION
  // ----------------------------------------
  const generateSKU = () => {
    if (!formData.name) {
      return toast.error("Enter product name first");
    }

    const cleaned = formData.name.replace(/\s+/g, "").toUpperCase();
    const random = Math.floor(10000 + Math.random() * 90000);
    const sku = `${cleaned}-${random}`;

    setFormData({ ...formData, sku });
    toast.success("SKU generated!");
  };

  // ----------------------------------------
  // LOAD CATEGORIES
  // ----------------------------------------
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("https://api.apexbee.in/api/categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        toast.error("Failed to load categories");
      }
    };

    loadCategories();
  }, []);

  // ----------------------------------------
  // IMAGE PREVIEW
  // ----------------------------------------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  // ----------------------------------------
  // SUBMIT
  // ----------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const vendor = JSON.parse(localStorage.getItem("vendor"));
    if (!vendor) return toast.error("Login first");

    const form = new FormData();
    form.append("name", formData.name);
    form.append("sku", formData.sku);
    form.append("price", formData.price);
    form.append("category", formData.category);
    form.append("subcategory", formData.subcategory);
    form.append("stock", formData.stock);
    form.append("description", formData.description);
    form.append("vendorId", vendor.id);

    if (formData.image) form.append("image", formData.image);

    const res = await fetch("https://api.apexbee.in/api/products", {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    if (data.product) {
      toast.success("Product added!");
      navigate("/products");
    } else {
      toast.error("Failed to add product");
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Product Name */}
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                {/* SKU + BTN */}
                <div className="space-y-2">
                  <Label>SKU *</Label>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Click generate button"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      required
                    />

                    <Button type="button" onClick={generateSKU}>
                      Generate
                    </Button>
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    placeholder="Enter price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Dynamic Categories */}
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>

                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory */}
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subcategory: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    placeholder="Stock quantity"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  placeholder="Product description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label>Product Image</Label>
                <Input type="file" accept="image/*" onChange={handleImageChange} />

                {preview && (
                  <img
                    src={preview}
                    className="w-32 h-32 rounded object-cover mt-4"
                  />
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Add Product
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/products")}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AddProduct;
