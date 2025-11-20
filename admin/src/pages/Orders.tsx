import { useState } from "react";
import { mockOrders, Order } from "@/data/mockData";
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
  const [orders, setOrders] = useState(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: "secondary" as const, className: "bg-warning text-warning-foreground", icon: Package },
      confirmed: { variant: "default" as const, className: "bg-primary text-primary-foreground", icon: CheckCircle2 },
      shipped: { variant: "default" as const, className: "bg-accent text-accent-foreground", icon: Truck },
      delivered: { variant: "default" as const, className: "bg-success text-success-foreground", icon: CheckCircle2 },
      cancelled: { variant: "destructive" as const, className: "bg-destructive text-destructive-foreground", icon: XCircle },
    };
    const { variant, className, icon: Icon } = config[status as keyof typeof config];
    return (
      <Badge variant={variant} className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    );
    toast.success("Order status updated");
  };

  const columns = [
    { header: "Order #", accessor: (item: Order) => item.orderNumber },
    { header: "Customer", accessor: (item: Order) => item.customerName },
    { header: "Vendor", accessor: (item: Order) => item.vendorName },
    { header: "Total", accessor: (item: Order) => `$${item.total.toFixed(2)}` },
    { header: "Status", accessor: (item: Order) => getStatusBadge(item.status) },
    { header: "Order Date", accessor: (item: Order) => item.orderDate },
    {
      header: "Actions",
      accessor: (item: Order) => (
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
                  <p className="text-sm text-muted-foreground">{selectedOrder.orderDate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Vendor</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.vendorName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-sm text-muted-foreground">${selectedOrder.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Products</p>
                <div className="space-y-2">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {product.quantity}</p>
                      </div>
                      <p className="font-medium">${(product.price * product.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Update Status</p>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => {
                    updateOrderStatus(selectedOrder.id, value as Order["status"]);
                    setSelectedOrder({ ...selectedOrder, status: value as Order["status"] });
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

              {/* Order Timeline */}
              <div>
                <p className="text-sm font-medium mb-3">Order Timeline</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.orderDate}</p>
                    </div>
                  </div>
                  {selectedOrder.status !== "pending" && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">Order Confirmed</p>
                        <p className="text-sm text-muted-foreground">Status updated</p>
                      </div>
                    </div>
                  )}
                  {(selectedOrder.status === "shipped" || selectedOrder.status === "delivered") && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">Order Shipped</p>
                        <p className="text-sm text-muted-foreground">On the way</p>
                      </div>
                    </div>
                  )}
                  {selectedOrder.status === "delivered" && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-success mt-2" />
                      <div>
                        <p className="font-medium">Order Delivered</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.deliveryDate}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
