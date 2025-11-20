import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { toast } from "sonner";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  stock: number;
  status: string[];
  images: string[];
  specifications: Record<string, string>;
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`https://api.apexbee.in/api/product/${id}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setProduct(data.product);
          setSelectedImage(data.product.images?.[0] || "");
        } else {
          toast.error(data.message || "Failed to fetch product details");
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong while fetching product");
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (!product) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 text-center text-lg font-medium text-muted-foreground">
          Loading product details...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Product Details</h1>
          <Button onClick={() => navigate(`/products/edit/${product._id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <Card className="p-6">
            <div className="mb-4">
              <img
                src={`${selectedImage}`}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images?.map((img, index) => (
                <img
                  key={index}
                  src={`${img}`}
                  alt={`${product.name} ${index + 1}`}
                  className={`w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 ${
                    selectedImage === img ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </Card>

          {/* Product Info */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-2">{product.name}</h2>

              {/* Status Badges */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {product.status?.map((status, i) => (
                  <Badge
                    key={i}
                    variant={status === "Top" ? "default" : "outline"}
                    className={status === "Deal" ? "bg-success text-white hover:bg-success/90" : ""}
                  >
                    {status}
                  </Badge>
                ))}
              </div>

              {/* Price Section */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-foreground">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
                {product.discount && (
                  <span className="text-lg text-success font-semibold">{product.discount}</span>
                )}
              </div>

              {/* Category / Subcategory / Stock */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subcategory:</span>
                  <span className="font-medium">{product.subcategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock:</span>
                  <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                    {product.stock} units
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            </Card>

            {/* Specifications */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Specifications</h3>
              <div className="space-y-2">
                {Object.entries(product.specifications || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetails;
