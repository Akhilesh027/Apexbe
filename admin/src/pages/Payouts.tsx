import { useState } from "react";
import { mockPayouts, Payout } from "@/data/mockData";
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
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const Payouts = () => {
  const [payouts, setPayouts] = useState(mockPayouts);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    payout: Payout | null;
    action: "approve" | "reject" | null;
  }>({ open: false, payout: null, action: null });

  const handleAction = (payout: Payout, action: "approve" | "reject") => {
    setActionDialog({ open: true, payout, action });
  };

  const confirmAction = () => {
    if (!actionDialog.payout || !actionDialog.action) return;

    const newStatus = actionDialog.action === "approve" ? "approved" : "rejected";

    setPayouts((prev) =>
      prev.map((p) =>
        p.id === actionDialog.payout!.id
          ? { ...p, status: newStatus as any, processedDate: new Date().toISOString().split("T")[0] }
          : p
      )
    );

    toast.success(`Payout ${actionDialog.action}ed successfully`);
    setActionDialog({ open: false, payout: null, action: null });
  };

  const columns = [
    { header: "Vendor Name", accessor: (item: Payout) => item.vendorName },
    { header: "Amount", accessor: (item: Payout) => `$${item.amount.toFixed(2)}` },
    {
      header: "Status",
      accessor: (item: Payout) => (
        <Badge
          variant={
            item.status === "approved" ? "default" : item.status === "pending" ? "secondary" : "destructive"
          }
          className={
            item.status === "approved"
              ? "bg-success text-success-foreground"
              : item.status === "pending"
              ? "bg-warning text-warning-foreground"
              : "bg-destructive text-destructive-foreground"
          }
        >
          {item.status}
        </Badge>
      ),
    },
    { header: "Request Date", accessor: (item: Payout) => item.requestDate },
    {
      header: "Processed Date",
      accessor: (item: Payout) => item.processedDate || "-",
    },
    {
      header: "Actions",
      accessor: (item: Payout) =>
        item.status === "pending" ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-success hover:bg-success/10"
              onClick={() => handleAction(item, "approve")}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => handleAction(item, "reject")}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No actions</span>
        ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Vendor Payouts</h1>
        <p className="text-muted-foreground">Manage vendor withdrawal requests and earnings</p>
      </div>

      <DataTable data={payouts} columns={columns} searchKey="vendorName" />

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={() => setActionDialog({ open: false, payout: null, action: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payout {actionDialog.action}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionDialog.action} this payout request for{" "}
              {actionDialog.payout?.vendorName}?
            </DialogDescription>
          </DialogHeader>
          {actionDialog.payout && (
            <div className="space-y-2 py-4">
              <p className="text-sm">
                <span className="font-medium">Vendor:</span> {actionDialog.payout.vendorName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Amount:</span> ${actionDialog.payout.amount.toFixed(2)}
              </p>
              <p className="text-sm">
                <span className="font-medium">Request Date:</span> {actionDialog.payout.requestDate}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, payout: null, action: null })}
            >
              Cancel
            </Button>
            <Button onClick={confirmAction}>Confirm {actionDialog.action}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payouts;
