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
  vendorName: string;
  itemType: string;
  categoryName: string;
  subcategoryName?: string;
  itemName: string;
  salesPrice: number;
  gstRate: number;
  description: string;
  images: string[];
  skuCode: string;
  measuringUnit: string;
  hsnCode: string;
  godown: string;
  openStock: number;
  asOnDate: string;
  userPrice: number;
  discount: number;
  afterDiscount: number;
  commission: number;
  finalAmount: number;
  priceType: string;
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

        if (res.ok) {
          setProduct(data);
          setSelectedImage(data.images?.[0] || "");
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
                src={selectedImage}
                alt={product.itemName}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images?.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${product.itemName} ${index + 1}`}
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
              <h2 className="text-2xl font-bold mb-2">{product.itemName}</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor:</span>
                  <span className="font-medium">{product.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Type:</span>
                  <span className="font-medium">{product.itemType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{product.categoryName}</span>
                </div>
                {product.subcategoryName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subcategory:</span>
                    <span className="font-medium">{product.subcategoryName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Price:</span>
                  <span className="font-medium">₹{product.salesPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST Rate:</span>
                  <span className="font-medium">{product.gstRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU Code:</span>
                  <span className="font-medium">{product.skuCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Measuring Unit:</span>
                  <span className="font-medium">{product.measuringUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HSN Code:</span>
                  <span className="font-medium">{product.hsnCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Godown:</span>
                  <span className="font-medium">{product.godown}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open Stock:</span>
                  <Badge variant={product.openStock > 0 ? "default" : "destructive"}>
                    {product.openStock} units
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">As On Date:</span>
                  <span className="font-medium">{product.asOnDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MRP:</span>
                  <span className="font-medium">₹{product.userPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">{product.discount}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">After Discount:</span>
                  <span className="font-medium">₹{product.afterDiscount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission:</span>
                  <span className="font-medium">₹{product.commission}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Amount:</span>
                  <span className="font-medium">₹{product.finalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Type:</span>
                  <span className="font-medium">{product.priceType}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetails;
