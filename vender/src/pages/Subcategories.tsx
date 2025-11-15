import { useEffect, useState } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { toast } from "sonner";

interface Subcategory {
  _id: string;
  name: string;
  image: string;
  category: { _id: string; name: string };
}

const Subcategories = () => {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category");
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch subcategories from backend
  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://website-backend-57f9.onrender.com/api/subcategories", {
        params: categoryId ? { category: categoryId } : {},
      });
      if (res.data.success) {
        setSubcategories(res.data.subcategories);
      } else {
        toast.error("Failed to fetch subcategories");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch subcategories");
    } finally {
      setLoading(false);
    }
  };

  // Delete subcategory
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subcategory?")) return;
    try {
      const res = await axios.delete(`https://website-backend-57f9.onrender.com/api/subcategories/${id}`);
      if (res.data.success) {
        toast.success("Subcategory deleted successfully");
        setSubcategories((prev) => prev.filter((sub) => sub._id !== id));
      } else {
        toast.error("Failed to delete subcategory");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete subcategory");
    }
  };

  useEffect(() => {
    fetchSubcategories();
  }, [categoryId]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Subcategory Management</h1>
          <Link to={`/subcategories/add${categoryId ? `?category=${categoryId}` : ""}`}>
            <Button className="bg-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              ADD SUBCATEGORY
            </Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading subcategories...</p>
        ) : subcategories.length === 0 ? (
          <p className="text-center text-muted-foreground">No subcategories found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcategories.map((subcategory) => (
              <Card key={subcategory._id} className="p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{subcategory.name}</h2>
                  <div className="flex gap-2">
                    <Link to={`/subcategories/edit/${subcategory._id}`}>
                      <Button size="icon" variant="ghost" className="text-success hover:text-success/80">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive/80"
                      onClick={() => handleDelete(subcategory._id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <img
                    src={`${subcategory.image}`}
                    alt={subcategory.name}
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Subcategories;
