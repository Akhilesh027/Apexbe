import { useState, useEffect } from "react";
import axios from "axios";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Package, Truck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("https://api.apexbee.in/api/admin/orders");
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: "secondary", className: "bg-warning text-warning-foreground", icon: Package },
      confirmed: { variant: "default", className: "bg-primary text-primary-foreground", icon: CheckCircle2 },
      shipped: { variant: "default", className: "bg-accent text-accent-foreground", icon: Truck },
      delivered: { variant: "default", className: "bg-success text-success-foreground", icon: CheckCircle2 },
      cancelled: { variant: "destructive", className: "bg-destructive text-destructive-foreground", icon: XCircle },
    };
    const { variant, className, icon: Icon } = config[status as keyof typeof config];
    return (
      <Badge variant={variant} className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const columns = [
    { header: "Order #", accessor: (item: any) => item.orderNumber },
    { header: "Customer", accessor: (item: any) => item.userDetails.name },
    { header: "Total", accessor: (item: any) => `₹${item.orderSummary.total.toFixed(2)}` },
    { header: "Status", accessor: (item: any) => getStatusBadge(item.orderStatus.currentStatus) },
    { header: "Order Date", accessor: (item: any) => new Date(item.createdAt).toLocaleDateString() },
    {
      header: "Actions",
      accessor: (item: any) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedOrder(item)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground">Manage and track customer orders</p>
      </div>

      <DataTable data={orders} columns={columns} searchKey="orderNumber" />

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Complete information about the order</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Order Number</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Order Date</p>
                  <p className="text-sm text-muted-foreground">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.userDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-sm text-muted-foreground">₹{selectedOrder.orderSummary.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Status</p>
                  {getStatusBadge(selectedOrder.orderStatus.currentStatus)}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Products</p>
                <div className="space-y-2">
                  {selectedOrder.orderItems.map((product: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {product.quantity}</p>
                      </div>
                      <p className="font-medium">₹{product.itemTotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Update Status</p>
                <Select
                  value={selectedOrder.orderStatus.currentStatus}
                  onValueChange={(value) => {
                    setSelectedOrder({
                      ...selectedOrder,
                      orderStatus: { ...selectedOrder.orderStatus, currentStatus: value },
                    });
                    toast.success("Order status updated locally");
                    // TODO: Call backend API to update status
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
