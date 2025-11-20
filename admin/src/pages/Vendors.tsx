import { useState } from "react";
import { mockVendors, Vendor } from "@/data/mockData";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Ban, Eye } from "lucide-react";
import { toast } from "sonner";

const Vendors = () => {
  const [vendors, setVendors] = useState(mockVendors);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | "block" | null;
  }>({ open: false, action: null });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      blocked: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"} className={
        status === "approved" ? "bg-success text-success-foreground" :
        status === "pending" ? "bg-warning text-warning-foreground" :
        "bg-destructive text-destructive-foreground"
      }>
        {status}
      </Badge>
    );
  };

  const handleAction = (vendor: Vendor, action: "approve" | "reject" | "block") => {
    setSelectedVendor(vendor);
    setActionDialog({ open: true, action });
  };

  const confirmAction = () => {
    if (!selectedVendor || !actionDialog.action) return;

    const newStatus =
      actionDialog.action === "approve"
        ? "approved"
        : actionDialog.action === "reject"
        ? "rejected"
        : "blocked";

    setVendors((prev) =>
      prev.map((v) =>
        v.id === selectedVendor.id ? { ...v, status: newStatus as any } : v
      )
    );

    toast.success(`Vendor ${actionDialog.action}ed successfully`);
    setActionDialog({ open: false, action: null });
    setSelectedVendor(null);
  };

  const columns = [
    { header: "Vendor Name", accessor: (item: Vendor) => item.name },
    { header: "Shop Name", accessor: (item: Vendor) => item.shopName },
    { header: "Email", accessor: (item: Vendor) => item.email },
    { header: "Phone", accessor: (item: Vendor) => item.phone },
    { header: "GST", accessor: (item: Vendor) => item.gst },
    { header: "Status", accessor: (item: Vendor) => getStatusBadge(item.status) },
    {
      header: "Actions",
      accessor: (item: Vendor) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setSelectedVendor(item)}>
            <Eye className="h-4 w-4" />
          </Button>
          {item.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-success hover:bg-success/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(item, "approve");
                }}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(item, "reject");
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {item.status === "approved" && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(item, "block");
              }}
            >
              <Ban className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Vendors & Shops</h1>
        <p className="text-muted-foreground">Manage vendor accounts and shop approvals</p>
      </div>

      <DataTable data={vendors} columns={columns} searchKey="name" />

      {/* Vendor Details Dialog */}
      <Dialog open={!!selectedVendor && !actionDialog.open} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>Complete information about the vendor</DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{selectedVendor.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Shop Name</p>
                  <p className="text-sm text-muted-foreground">{selectedVendor.shopName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{selectedVendor.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{selectedVendor.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">GST Number</p>
                  <p className="text-sm text-muted-foreground">{selectedVendor.gst}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  {getStatusBadge(selectedVendor.status)}
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Shop Address</p>
                  <p className="text-sm text-muted-foreground">{selectedVendor.shopAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Products</p>
                  <p className="text-sm text-muted-foreground">{selectedVendor.totalProducts}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Sales</p>
                  <p className="text-sm text-muted-foreground">{selectedVendor.totalSales}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Earnings</p>
                  <p className="text-sm text-muted-foreground">${selectedVendor.earnings}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={() => setActionDialog({ open: false, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionDialog.action} this vendor?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: null })}>
              Cancel
            </Button>
            <Button onClick={confirmAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vendors;
