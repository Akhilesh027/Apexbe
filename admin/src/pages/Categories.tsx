import { Plus, Edit, Trash } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("https://api.apexbee.in/api/categories"); // your backend endpoint
      if (res.data.success) {
        setCategories(res.data.categories);
      } else {
        toast.error(res.data.message || "Failed to fetch categories");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while fetching categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await axios.delete(`https://api.apexbee.in/api/categories/${id}`);
      if (res.data.success) {
        toast.success("Category deleted successfully");
        setCategories(categories.filter((cat) => cat._id !== id));
      } else {
        toast.error(res.data.message || "Failed to delete category");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while deleting category");
    }
  };


  return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Category Management</h1>
          <Link to="/categories/add">
            <Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              ADD CATEGORY
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category._id} className="p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{category.name}</h2>
                <div className="flex gap-2">
                  <Link to={`/categories/edit/${category._id}`}>
                    <Button size="icon" variant="ghost" className="text-success hover:text-success/80">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive/80"
                    onClick={() => handleDeleteCategory(category._id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Sub Categories: ({category.subcategories?.length || 0})
              </p>

              <div className="mb-4">
                <img
                  src={`${category.image}`}
                  alt={category.name}
                  className="w-24 h-24 object-cover rounded"
                />
              </div>

              <Link to={`/subcategories?category=${category._id}`}>
                <Button variant="outline" className="w-full mt-4 text-success border-success hover:bg-success/10">
                  <Plus className="h-4 w-4 mr-2" />
                  ADD SUB - CATEGORY
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
  );
};

export default Categories;
