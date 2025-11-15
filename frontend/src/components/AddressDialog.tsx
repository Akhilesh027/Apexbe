import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (address: any) => void;
  currentAddress: any;
  isLoading?: boolean;
}

export const AddressDialog = ({
  open,
  onOpenChange,
  onSave,
  currentAddress,
  isLoading = false,
}: AddressDialogProps) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Prefill data when dialog opens
  useEffect(() => {
    if (currentAddress) {
      setName(currentAddress.name || "");
      setAddress(currentAddress.address || "");
      setPhone(currentAddress.phone || "");
      setPincode(currentAddress.pincode || "");
      setCity(currentAddress.city || "");
      setState(currentAddress.state || "");
    }
  }, [currentAddress, open]); // Added 'open' to dependencies to reset when dialog opens

  const handleSave = () => {
    const fullAddress = {
      name,
      phone,
      pincode,
      city,
      state,
      address,
    };
    onSave(fullAddress);
  };

  const handleCancel = () => {
    // Reset form when canceling
    if (currentAddress) {
      setName(currentAddress.name || "");
      setAddress(currentAddress.address || "");
      setPhone(currentAddress.phone || "");
      setPincode(currentAddress.pincode || "");
      setCity(currentAddress.city || "");
      setState(currentAddress.state || "");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add/Edit Delivery Address</DialogTitle>
          <DialogDescription>Enter your delivery address details below</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input 
              id="name"
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input 
              id="phone"
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              type="tel"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pincode">Pincode *</Label>
            <Input 
              id="pincode"
              value={pincode} 
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter pincode"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Enter your complete address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City *</Label>
              <Input 
                id="city"
                value={city} 
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State *</Label>
              <Input 
                id="state"
                value={state} 
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter state"
                required
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-yellow hover:bg-yellow/90 text-yellow-foreground"
            disabled={isLoading || !name || !phone || !pincode || !address || !city || !state}
          >
            {isLoading ? "Saving..." : "Save Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};