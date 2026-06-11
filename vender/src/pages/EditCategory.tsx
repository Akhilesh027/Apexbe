import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";

const EditCategory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    name: "",
    image: null as File | null,
  });
  const [preview, setPreview] = useState<string>("");

  // Fetch category details on mount
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await axios.get(`https://api.apexbee.in/api/categories/${id}`);
        if (res.data.success) {
          setFormData({ name: res.data.category.name, image: null });
          setPreview(res.data.category.image || "");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch category details");
      }
    };
    if (id) fetchCategory();
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
    if (!formData.name) {
      toast.error("Please enter category name");
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      if (formData.image) data.append("image", formData.image);

      const res = await axios.put(`https://api.apexbee.in/api/categories/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Category updated successfully!");
        navigate("/categories");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update category");
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter category name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Category Image</Label>
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
                <Button type="submit" className="flex-1">Update Category</Button>
                <Button type="button" variant="outline" onClick={() => navigate("/categories")} className="flex-1">
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

export default EditCategory;
