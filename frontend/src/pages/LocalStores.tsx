import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Store, Filter, RefreshCcw } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationModal from "@/components/LocationModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = "https://api.apexbee.in/api";
const LOCATION_KEY = "user_location";

type StoredLocation = {
  lat: number;
  lng: number;
  colony: string;
  pincode: string;
  address: string;
};

type Business = {
  _id: string;
  businessName: string;
  phone?: string;
  email?: string;
  businessTypes?: string[];
  industryType?: string;
  logo?: string;
  address?: string;
  state?: string;
  city?: string;
  pinCode: string;
  createdAt?: string;
};

const LocalStores = () => {
  const navigate = useNavigate();

  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<StoredLocation | null>(null);

  const [stores, setStores] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // ✅ load location
  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_KEY);
    if (saved) {
      try {
        setUserLocation(JSON.parse(saved));
      } catch {
        localStorage.removeItem(LOCATION_KEY);
      }
    } else {
      setOpenLocationModal(true);
    }
  }, []);

  const fetchStores = async (pincode: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_BASE}/business/by-pincode?pincode=${encodeURIComponent(pincode)}&limit=100`
      );
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch local stores");
      }

      setStores(Array.isArray(json?.data) ? json.data : []);
    } catch (e: any) {
      setStores([]);
      setError(e?.message || "Failed to fetch stores");
    } finally {
      setLoading(false);
    }
  };

  // ✅ fetch when location changes
  useEffect(() => {
    const pin = userLocation?.pincode?.trim();
    if (!pin) return;
    fetchStores(pin);
  }, [userLocation?.pincode]);

  // ✅ unique business types for filter
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => (s.businessTypes || []).forEach((t) => set.add(t)));
    return ["ALL", ...Array.from(set)];
  }, [stores]);

  // ✅ search + filter
  const filteredStores = useMemo(() => {
    const q = query.trim().toLowerCase();

    return stores.filter((s) => {
      const matchesQuery =
        !q ||
        s.businessName?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q) ||
        s.pinCode?.toLowerCase().includes(q);

      const matchesType =
        typeFilter === "ALL" ||
        (s.businessTypes || []).includes(typeFilter);

      return matchesQuery && matchesType;
    });
  }, [stores, query, typeFilter]);

  const locationLabel = useMemo(() => {
    if (!userLocation) return "Set delivery location";
    const colony = userLocation.colony?.trim();
    const pin = userLocation.pincode?.trim();
    if (colony && pin) return `${colony} - ${pin}`;
    if (pin) return pin;
    return "Location set";
  }, [userLocation]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Top Header */}
      <section className="container mx-auto px-4 pt-6">
        <div className="rounded-3xl border bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
                Local Stores Near You
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="truncate">
                  {locationLabel}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-white"
                onClick={() => setOpenLocationModal(true)}
              >
                Change Location
              </Button>

              <Button
                variant="outline"
                onClick={() => userLocation?.pincode && fetchStores(userLocation.pincode)}
                disabled={!userLocation?.pincode || loading}
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stores by name, city, pincode..."
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Filter className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-md border bg-background text-sm"
              >
                {availableTypes.map((t) => (
                  <option value={t} key={t}>
                    {t === "ALL" ? "All Types" : t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-10">
        {!userLocation?.pincode ? (
          <div className="rounded-3xl border bg-muted/20 p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-white border flex items-center justify-center">
              <MapPin className="h-7 w-7 text-accent" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-navy">Set your location</h3>
            <p className="text-muted-foreground mt-1">
              Choose your location to load local stores near you.
            </p>
            <Button className="mt-5" onClick={() => setOpenLocationModal(true)}>
              Set Location
            </Button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-3xl border bg-white p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border bg-red-50 p-12 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => fetchStores(userLocation.pincode)}
            >
              Retry
            </Button>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="rounded-3xl border bg-muted/20 p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-white border flex items-center justify-center">
              <Store className="h-7 w-7 text-navy" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-navy">No stores found</h3>
            <p className="text-muted-foreground mt-1">
              Try another pincode or change location.
            </p>
            <Button className="mt-5" onClick={() => setOpenLocationModal(true)}>
              Change Location
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStores.map((shop) => (
              <button
                key={shop._id}
                type="button"
                onClick={() => navigate(`/business/${shop._id}`)}
                className="group rounded-3xl border bg-white p-5 text-left hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden bg-muted border flex items-center justify-center shrink-0">
                    {shop.logo ? (
                      <img
                        src={shop.logo}
                        alt={shop.businessName}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <Store className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-navy text-lg leading-tight truncate">
                      {shop.businessName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {shop.city}, {shop.state} • {shop.pinCode}
                    </p>

                    {shop.businessTypes?.length ? (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {shop.businessTypes.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-1 rounded-full bg-muted border text-navy"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {shop.address ? (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {shop.address}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button className="flex-1">View Store</Button>
                  {shop.phone ? (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${shop.phone}`, "_self");
                      }}
                    >
                      Call
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1" disabled>
                      Call
                    </Button>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Location Modal */}
      <LocationModal
        open={openLocationModal}
        onOpenChange={setOpenLocationModal}
        onConfirm={(loc) => {
          setUserLocation(loc);
          localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
          if (loc?.pincode) fetchStores(loc.pincode);
        }}
      />

      <Footer />
    </div>
  );
};

export default LocalStores;
