import { useEffect, useMemo, useState } from "react";
import { X, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // ✅ parent will receive confirmed location
  onConfirm?: (payload: {
    lat: number;
    lng: number;
    address: string;
    colony: string;
    pincode: string;
    raw?: any;
  }) => void;
}

type GeoState = {
  status: "idle" | "locating" | "geocoding" | "ready" | "error";
  lat?: number;
  lng?: number;
  address?: string;
  colony?: string;
  pincode?: string;
  raw?: any;
  error?: string;
};

const LocationModal = ({ open, onOpenChange, onConfirm }: LocationModalProps) => {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });

  const canUseGeo = useMemo(
    () => typeof window !== "undefined" && "geolocation" in navigator,
    []
  );

  // Reset modal state each time it opens
  useEffect(() => {
    if (open) {
      setGeo({ status: "idle" });
    }
  }, [open]);

  const reverseGeocode = async (lat: number, lng: number) => {
    // ✅ addressdetails=1 so we can extract postcode/neighbourhood/suburb etc.
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch address");
    const data = await res.json();

    const addr = data?.address || {};

    // ✅ colony-like fields (OSM varies by location)
    const colony =
      addr.neighbourhood ||
      addr.suburb ||
      addr.residential ||
      addr.quarter ||
      addr.hamlet ||
      addr.village ||
      addr.town ||
      addr.city_district ||
      addr.city ||
      addr.county ||
      "Unknown area";

    const pincode = addr.postcode || "";

    const address = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    return { address, colony, pincode, raw: data };
  };

  const enableLocation = async () => {
    if (!canUseGeo) {
      setGeo({
        status: "error",
        error: "Geolocation is not supported in this browser.",
      });
      return;
    }

    setGeo({ status: "locating" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          setGeo({ status: "geocoding", lat, lng });

          const { address, colony, pincode, raw } = await reverseGeocode(lat, lng);

          setGeo({
            status: "ready",
            lat,
            lng,
            address,
            colony,
            pincode,
            raw,
          });
        } catch (e: any) {
          setGeo({
            status: "error",
            lat,
            lng,
            error: e?.message || "Could not get address from coordinates.",
          });
        }
      },
      (err) => {
        const msg =
          err.code === 1
            ? "Permission denied. Please allow location access."
            : err.code === 2
            ? "Position unavailable. Try again."
            : "Location request timed out. Try again.";

        setGeo({ status: "error", error: msg });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const confirmLocation = () => {
    if (geo.status !== "ready" || geo.lat == null || geo.lng == null) return;

    const payload = {
      lat: geo.lat,
      lng: geo.lng,
      address: geo.address || `${geo.lat}, ${geo.lng}`,
      colony: geo.colony || "",
      pincode: geo.pincode || "",
      raw: geo.raw,
    };

    // ✅ Send to parent
    onConfirm?.(payload);

    // ✅ Save locally
    localStorage.setItem("user_location", JSON.stringify(payload));

    onOpenChange(false);
  };

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={close}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center py-6 space-y-6">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <MapPin className="h-16 w-16 text-accent opacity-20" />
            </div>
            <MapPin className="h-16 w-16 text-accent relative" />
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-navy">Set your location</h3>
            <p className="text-sm text-muted-foreground">
              We use your location to show nearby stores and faster delivery options.
            </p>
          </div>

          {/* Status card */}
          <div className="w-full rounded-lg border bg-muted/20 p-4 text-sm">
            {geo.status === "idle" && (
              <p className="text-muted-foreground">
                Click <b>Enable Location</b> to detect your current location.
              </p>
            )}

            {(geo.status === "locating" || geo.status === "geocoding") && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {geo.status === "locating"
                    ? "Detecting your location..."
                    : "Getting your colony & pincode..."}
                </span>
              </div>
            )}

            {geo.status === "ready" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-navy font-medium">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Location found
                </div>

                {/* ✅ Colony + Pincode */}
                <p className="font-semibold text-navy">
                  {geo.colony}
                  {geo.pincode ? ` - ${geo.pincode}` : ""}
                </p>

                {/* Full address (small) */}
                <p className="text-muted-foreground text-xs line-clamp-2">
                  {geo.address}
                </p>

                <p className="text-xs text-muted-foreground">
                  {geo.lat?.toFixed(5)}, {geo.lng?.toFixed(5)}
                </p>
              </div>
            )}

            {geo.status === "error" && (
              <p className="text-red-600">{geo.error || "Something went wrong."}</p>
            )}
          </div>

          {/* Actions */}
          <div className="text-center space-y-3 w-full">
            <Button
              className="w-full bg-accent hover:bg-accent/90 text-white"
              onClick={confirmLocation}
              disabled={geo.status !== "ready"}
            >
              Confirm Location
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={enableLocation}
              disabled={!canUseGeo || geo.status === "locating" || geo.status === "geocoding"}
            >
              {geo.status === "locating" || geo.status === "geocoding" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2 text-accent" />
                  Enable Location
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={close}
            >
              Not Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
