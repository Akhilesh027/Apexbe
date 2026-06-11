import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";

const EditSubcategory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    image: null as File | null,
  });
  const [preview, setPreview] = useState<string>("");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get("https://api.apexbee.in/api/categories");
      if (res.data.success) setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch categories");
    }
  };

  // Fetch subcategory details
  const fetchSubcategory = async () => {
    if (!id) return;
    try {
      const res = await axios.get(`https://api.apexbee.in/api/subcategories/${id}`);
      if (res.data.success) {
        const sub = res.data.subcategory;
        setFormData({
          name: sub.name,
          category: sub.category._id,
          image: null,
        });
        setPreview(sub.image);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch subcategory details");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubcategory();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("category", formData.category);
      if (formData.image) data.append("image", formData.image);

      const res = await axios.put(
        `https://api.apexbee.in/api/subcategories/${id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        toast.success("Subcategory updated successfully!");
        navigate(`/subcategories?category=${formData.category}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update subcategory");
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Subcategory</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Parent Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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

              <div className="space-y-2">
                <Label htmlFor="name">Subcategory Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter subcategory name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Subcategory Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {preview && (
                  <div className="mt-4">
                    <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded" />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">Update Subcategory</Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
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

export default EditSubcategory;
