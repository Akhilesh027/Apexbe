import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  Wallet,
  Clock,
  Landmark,
  Info,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  orderId?: string;
  description: string;
  createdAt: string;
}

interface WithdrawalRequest {
  _id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

const getVendorIdFromToken = (): string | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || payload.vendorId || null;
  } catch {
    return null;
  }
};

const VendorEarnings = () => {
  const { vendorId: urlVendorId } = useParams<{ vendorId?: string }>();
  const [loggedInVendorId, setLoggedInVendorId] = useState<string | null>(null);
  const isOwnView = !urlVendorId;

  const [earnings, setEarnings] = useState<{
    total: number;
    pending: number;
    withdrawn: number;
    history: Transaction[];
  } | null>(null);

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifsc: "",
    accountName: "",
  });
  const [upiId, setUpiId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const effectiveVendorId = urlVendorId || loggedInVendorId;

  useEffect(() => {
    if (isOwnView) {
      const id = getVendorIdFromToken();

      if (!id) {
        setError("Vendor ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      setLoggedInVendorId(id);
    }
  }, [isOwnView]);

  const fetchData = async () => {
    if (!effectiveVendorId) return;

    setLoading(true);
    setError(null);

    try {
      const earningsRes = await fetch(
        `https://api.apexbee.in/api/vendor/earnings/${effectiveVendorId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!earningsRes.ok) {
        const errData = await earningsRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch earnings");
      }

      const earningsData = await earningsRes.json();

      setEarnings({
        total: earningsData.totalEarned ?? earningsData.total ?? 0,
        pending: earningsData.pendingBalance ?? earningsData.pending ?? 0,
        withdrawn: earningsData.withdrawn ?? 0,
        history: earningsData.transactions ?? earningsData.history ?? [],
      });

      if (isOwnView) {
        const withdrawalsRes = await fetch(
          `https://api.apexbee.in/api/vendor/withdrawal/requests/${effectiveVendorId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (withdrawalsRes.ok) {
          const withdrawalsData = await withdrawalsRes.json();
          setWithdrawals(withdrawalsData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveVendorId) {
      fetchData();
    }
  }, [effectiveVendorId]);

  const handleWithdraw = async () => {
    if (!effectiveVendorId) {
      toast.error("Vendor ID not available");
      return;
    }

    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (earnings && amount > earnings.pending) {
      toast.error("Amount exceeds pending earnings");
      return;
    }

    if (amount < 100) {
      toast.error("Minimum withdrawal amount is ₹100");
      return;
    }

    if (paymentMethod === "bank") {
      if (!bankDetails.accountName.trim()) {
        toast.error("Account holder name is required");
        return;
      }

      if (!bankDetails.accountNumber.trim()) {
        toast.error("Account number is required");
        return;
      }

      if (!bankDetails.ifsc.trim()) {
        toast.error("IFSC code is required");
        return;
      }
    } else if (paymentMethod === "upi") {
      if (!upiId.trim()) {
        toast.error("UPI ID is required");
        return;
      }
    }

    const payload = {
      vendorId: effectiveVendorId,
      amount,
      paymentMethod,
      ...(paymentMethod === "bank" ? { bankDetails } : { upiId }),
    };

    setSubmitting(true);

    try {
      const res = await fetch("https://api.apexbee.in/api/vendor/withdrawal/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Withdrawal request submitted successfully");
        setDialogOpen(false);
        setWithdrawAmount("");
        setBankDetails({
          accountNumber: "",
          ifsc: "",
          accountName: "",
        });
        setUpiId("");
        fetchData();
      } else {
        toast.error(data.error || "Request failed");
      }
    } catch {
      toast.error("Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    if (status === "approved") return "bg-green-100 text-green-800";
    if (status === "rejected") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {isOwnView ? "My Earnings" : "Vendor Earnings"}
            </h1>

            <p className="text-muted-foreground mt-1">
              Track your earnings, payout balance, withdrawal requests and transaction activity.
            </p>

            {!isOwnView && urlVendorId && (
              <p className="text-muted-foreground mt-1">Vendor ID: {urlVendorId}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {isOwnView && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Request Withdrawal</Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Withdrawal</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                      Available balance:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(earnings?.pending || 0)}
                      </span>
                    </div>

                    <div>
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter withdrawal amount"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum ₹100 withdrawal required.
                      </p>
                    </div>

                    <div>
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === "bank" ? (
                      <>
                        <div>
                          <Label>Account Holder Name</Label>
                          <Input
                            value={bankDetails.accountName}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                accountName: e.target.value,
                              })
                            }
                            placeholder="Enter account holder name"
                          />
                        </div>

                        <div>
                          <Label>Account Number</Label>
                          <Input
                            value={bankDetails.accountNumber}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                accountNumber: e.target.value,
                              })
                            }
                            placeholder="Enter account number"
                          />
                        </div>

                        <div>
                          <Label>IFSC Code</Label>
                          <Input
                            value={bankDetails.ifsc}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                ifsc: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder="Enter IFSC code"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <Label>UPI ID</Label>
                        <Input
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="username@bank"
                        />
                      </div>
                    )}

                    <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                      Please verify your payment details before submitting. Incorrect details may
                      delay the payout process.
                    </div>

                    <Button onClick={handleWithdraw} className="w-full" disabled={submitting}>
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Submit Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Earned</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-green-600">
              {formatCurrency(earnings?.total || 0)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Balance</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-blue-600">
              {formatCurrency(earnings?.pending || 0)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Withdrawn</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-gray-600">
              {formatCurrency(earnings?.withdrawn || 0)}
            </CardContent>
          </Card>
        </div>

        {isOwnView && (
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Information</CardTitle>
            </CardHeader>

            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4" />
                  <h3 className="font-semibold">Minimum Withdrawal</h3>
                </div>
                <p className="text-muted-foreground">
                  You can request a payout once your available balance reaches ₹100.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <h3 className="font-semibold">Processing Time</h3>
                </div>
                <p className="text-muted-foreground">
                  Withdrawal requests are reviewed by admin and usually processed within 1–3
                  business days.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="h-4 w-4" />
                  <h3 className="font-semibold">Payment Methods</h3>
                </div>
                <p className="text-muted-foreground">
                  Vendors can receive payouts through Bank Transfer or UPI.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isOwnView && (
          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>

            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex gap-3 rounded-lg border p-4">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Request Review</h3>
                  <p className="text-muted-foreground">
                    Every withdrawal request is checked by the admin before approval.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border p-4">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Correct Details</h3>
                  <p className="text-muted-foreground">
                    Enter accurate bank or UPI details to avoid payout delays or rejection.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border p-4">
                <HelpCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Need Help?</h3>
                  <p className="text-muted-foreground">
                    For payout issues, contact support with your vendor ID and request date.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
            {isOwnView && <TabsTrigger value="requests">Withdrawal Requests</TabsTrigger>}
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {earnings?.history?.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{tx.orderId?.slice(-6) || "-"}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            tx.amount > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {tx.amount > 0
                            ? `+${formatCurrency(tx.amount)}`
                            : formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}

                    {(!earnings?.history || earnings.history.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="space-y-1">
                            <p className="font-medium">No transactions yet.</p>
                            <p className="text-sm text-muted-foreground">
                              Your earnings will appear here after successful orders are completed.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwnView && (
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Requests</CardTitle>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {withdrawals.map((req) => (
                        <TableRow key={req._id}>
                          <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{formatCurrency(req.amount)}</TableCell>
                          <TableCell className="capitalize">{req.paymentMethod}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusClass(
                                req.status
                              )}`}
                            >
                              {req.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}

                      {withdrawals.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="space-y-1">
                              <p className="font-medium">No withdrawal requests yet.</p>
                              <p className="text-sm text-muted-foreground">
                                Once you submit a withdrawal request, the status will be shown here.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default VendorEarnings;