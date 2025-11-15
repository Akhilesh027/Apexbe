import { X, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LocationModal = ({ open, onOpenChange }: LocationModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex flex-col items-center py-6 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <MapPin className="h-16 w-16 text-accent opacity-20" />
            </div>
            <MapPin className="h-16 w-16 text-accent relative" />
          </div>

          <div className="text-center space-y-4 w-full">
            <Button className="w-full bg-accent hover:bg-accent/90 text-white">
              Confirm Location
            </Button>

            <Button variant="outline" className="w-full">
              <MapPin className="h-4 w-4 mr-2 text-accent" />
              Enable Location
            </Button>

            <Button variant="ghost" className="w-full text-muted-foreground">
              Not Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
