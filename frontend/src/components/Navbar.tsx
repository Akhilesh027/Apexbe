import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  Wallet,
  ChevronDown,
  X,
  ChevronRight,
  Package,
  Layers,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useEffect, useMemo, useState, useCallback } from "react";
import logo from "../Web images/Web images/logo.png";
import FormModal from "./FormModal.tsx";

const API_BASE = "https://api.apexbee.in/api"; // ✅ change if needed
const TOKEN_KEY = "token";
const USER_KEY = "user";

type CategoryItem = {
  _id: string;
  name: string;
  image?: string;
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  const [loading, setLoading] = useState({
    wallet: false,
    cart: false,
    orders: false,
    categories: false,
  });

  const [earnDropdownOpen, setEarnDropdownOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalEndpoint, setModalEndpoint] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileEarnOpen, setMobileEarnOpen] = useState(false);

  // ✅ Shop by Category dropdown
  const [shopByOpen, setShopByOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const handleOpenForm = (title: string, endpoint: string) => {
    setModalTitle(title);
    setModalEndpoint(endpoint);
    setModalOpen(true);
    setEarnDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileEarnOpen(false);
  };

  const getUserData = useCallback(() => {
    const user = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    return { user: user ? JSON.parse(user) : null, token };
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);

    setLoggedInUser(null);
    setCartItemsCount(0);
    setWalletBalance(0);
    setOrdersCount(0);

    setMobileMenuOpen(false);
    setEarnDropdownOpen(false);
    setShopByOpen(false);

    navigate("/login");
  }, [navigate]);

  // ✅ cart count
  const fetchCartItemsCount = useCallback(
    async (userId: string, token: string) => {
      if (!userId || !token) return;

      try {
        setLoading((p) => ({ ...p, cart: true }));
        const response = await fetch(`${API_BASE}/cart/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const items = Array.isArray(data?.cart?.items) ? data.cart.items : [];
          const totalItems = items.reduce(
            (total: number, item: any) => total + (item?.quantity || 0),
            0
          );
          setCartItemsCount(totalItems);
        } else if (response.status === 401) {
          handleLogout();
        } else {
          setCartItemsCount(0);
        }
      } catch (error) {
        console.error("Error fetching cart items count:", error);
        setCartItemsCount(0);
      } finally {
        setLoading((p) => ({ ...p, cart: false }));
      }
    },
    [handleLogout]
  );

  // ✅ orders count
  const fetchOrdersCount = useCallback(
    async (userId: string, token: string) => {
      if (!userId || !token) return;

      try {
        setLoading((p) => ({ ...p, orders: true }));
        const response = await fetch(`${API_BASE}/orders/${userId}/count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setOrdersCount(data?.count || 0);
        } else if (response.status === 401) {
          handleLogout();
        } else {
          setOrdersCount(0);
        }
      } catch (error) {
        console.error("Error fetching orders count:", error);
        setOrdersCount(0);
      } finally {
        setLoading((p) => ({ ...p, orders: false }));
      }
    },
    [handleLogout]
  );

  // ✅ wallet
  const fetchWalletBalance = useCallback(
    async (token: string) => {
      if (!token) return;

      try {
        setLoading((p) => ({ ...p, wallet: true }));
        const response = await fetch(`${API_BASE}/referrals/stats`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data?.totalEarnings || 0);
        } else if (response.status === 401) {
          handleLogout();
        } else {
          setWalletBalance(0);
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        setWalletBalance(0);
      } finally {
        setLoading((p) => ({ ...p, wallet: false }));
      }
    },
    [handleLogout]
  );

  // ✅ categories for shop-by dropdown
  const fetchCategories = useCallback(async () => {
    try {
      setLoading((p) => ({ ...p, categories: true }));
      const res = await fetch(`${API_BASE}/categories`);
      const json = await res.json();

      const list = Array.isArray(json?.categories) ? json.categories : [];
      setCategories(
        list.map((c: any) => ({
          _id: c._id,
          name: c.name,
          image: c.image,
        }))
      );
    } catch (e) {
      console.error("Error loading categories:", e);
      setCategories([]);
    } finally {
      setLoading((p) => ({ ...p, categories: false }));
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    const { user, token } = getUserData();

    if (user && token) {
      setLoggedInUser(user);
      await Promise.all([
        fetchCartItemsCount(user._id, token),
        fetchOrdersCount(user._id, token),
        fetchWalletBalance(token),
      ]);
    } else {
      setLoggedInUser(null);
      setCartItemsCount(0);
      setWalletBalance(0);
      setOrdersCount(0);
    }
  }, [getUserData, fetchCartItemsCount, fetchOrdersCount, fetchWalletBalance]);

  // initial load
  useEffect(() => {
    fetchUserData();
    fetchCategories();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_KEY || e.key === TOKEN_KEY) fetchUserData();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchUserData, fetchCategories]);

  // refresh counts on route change (important)
  useEffect(() => {
    fetchUserData();
    // close popovers on navigation
    setEarnDropdownOpen(false);
    setShopByOpen(false);
    setMobileMenuOpen(false);
    setMobileEarnOpen(false);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // periodic refresh
  useEffect(() => {
    if (!loggedInUser) return;

    const { user, token } = getUserData();
    if (!user || !token) return;

    const interval = setInterval(() => {
      fetchCartItemsCount(user._id, token);
      fetchOrdersCount(user._id, token);
    }, 30000);

    return () => clearInterval(interval);
  }, [loggedInUser, fetchCartItemsCount, fetchOrdersCount, getUserData]);

  const formatWalletBalance = (balance: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(balance);
  };

  const badge = (val: number, loadingState: boolean) => {
    if (loadingState) {
      return (
        <span className="absolute -top-2 -right-2 bg-gray-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          ...
        </span>
      );
    }
    if (!val) return null;
    return (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
        {val > 9 ? "9+" : val}
      </span>
    );
  };

  const categoryDropdown = useMemo(() => {
    if (!shopByOpen) return null;

    return (
      <div className="absolute top-full left-0 mt-2 w-[320px] rounded-xl border bg-white text-black shadow-lg z-50 overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="font-bold text-navy">Shop by Category</p>
          <button
            className="text-sm text-muted-foreground hover:text-navy"
            onClick={() => {
              setShopByOpen(false);
              navigate("/categories");
            }}
          >
            View All
          </button>
        </div>

        <div className="max-h-[360px] overflow-auto">
          {loading.categories ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200" />
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No categories found.</div>
          ) : (
            categories.map((c) => (
              <button
                key={c._id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                onClick={() => {
                  setShopByOpen(false);
                  navigate(`/category/${c.name}`);
                }}
              >
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <Layers className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-navy capitalize">{c.name}</p>
                  <p className="text-xs text-muted-foreground">Browse products</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }, [shopByOpen, categories, loading.categories, navigate]);

  return (
    <nav className="bg-navy-dark text-white sticky top-0 z-50">
      {/* Row 1 */}
      <div className="border-b border-navy-light">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold">
              <img src={logo} alt="logo" className="w-32 h-auto" />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8 text-sm">
              <Link to="/" className="hover:text-accent transition">HOME</Link>
              <Link to="/categories" className="hover:text-accent transition">CATEGORY</Link>

              {/* Earn With Us */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 hover:text-accent hover:bg-transparent"
                  onClick={() => setEarnDropdownOpen((v) => !v)}
                >
                  EARN WITH US <ChevronDown className="h-4 w-4" />
                </Button>

                {earnDropdownOpen && (
                  <div className="absolute top-full left-0 bg-white text-black rounded shadow-lg mt-1 w-56 z-50">
                    <button className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleOpenForm("Become a Vendor", "vendor")}>
                      BECOME A VENDOR
                    </button>
                    <button className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleOpenForm("Become a Franchiser", "franchiser")}>
                      BECOME A FRANCHISER
                    </button>
                    <button className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleOpenForm("Become a Freelancer", "freelancer")}>
                      BECOME A FREELANCER
                    </button>
                    <button className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleOpenForm("Become an Entrepreneur", "entrepreneur")}>
                      BECOME AN ENTREPRENEUR
                    </button>
                  </div>
                )}
              </div>

              <Link to="/local-stores" className="hover:text-accent transition">LOCAL STORES</Link>
              <Link to="/referrals" className="hover:text-accent transition">REFER & EARN</Link>
            </div>

            <FormModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title={modalTitle}
              endpoint={modalEndpoint}
            />

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              <Link to="/wishlist" className="hidden sm:block hover:text-accent transition text-xs">
                Wishlist
              </Link>

              {loggedInUser && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7 flex items-center gap-1"
                  onClick={() => navigate("/referrals")}
                  title="Click to view referral earnings"
                  disabled={loading.wallet}
                >
                  <Wallet className="h-3 w-3" />
                  {loading.wallet ? <span className="animate-pulse">...</span> : formatWalletBalance(walletBalance)}
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <button className="md:hidden" onClick={() => setMobileMenuOpen((v) => !v)}>
                {mobileMenuOpen ? <X className="h-6 w-6 cursor-pointer" /> : <Menu className="h-6 w-6 cursor-pointer" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        {/* ✅ Shop by Category dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            className="text-foreground bg-white border-0 hover:bg-gray-50"
            onClick={() => setShopByOpen((v) => !v)}
          >
            <Menu className="h-4 w-4 mr-2" />
            Shop by Category
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          {categoryDropdown}
        </div>

        {/* Search */}
        <div className="flex-1 relative max-w-2xl">
          <Input
            type="text"
            placeholder="Search for a Product or Brand..."
            className="w-full bg-white text-foreground pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {/* ✅ Orders + Cart (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          {loggedInUser ? (
            <>
              {/* Orders */}
              <Link to="/my-orders">
                <Button
                  variant="ghost"
                  className="text-white hover:text-accent hover:bg-transparent relative flex items-center gap-2"
                  disabled={loading.orders}
                >
                  <div className="border rounded p-1 relative">
                    <Package className="h-4 w-4" />
                    {badge(ordersCount, loading.orders)}
                  </div>
                  <span className="text-sm">My Orders</span>
                </Button>
              </Link>

              {/* Cart */}
              <Link to="/cart">
                <Button
                  variant="ghost"
                  className="text-white hover:text-accent hover:bg-transparent relative flex items-center gap-2"
                  disabled={loading.cart}
                >
                  <div className="border rounded p-1 relative">
                    <ShoppingBag className="h-4 w-4" />
                    {badge(cartItemsCount, loading.cart)}
                  </div>
                  Cart
                </Button>
              </Link>

              {/* Profile + Logout */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <Link to="/profile" className="text-sm hover:text-accent transition font-medium">
                    Hi, {loggedInUser.name || "User"}
                  </Link>
                  {walletBalance > 0 && (
                    <span className="text-xs text-green-400">
                      Wallet: {formatWalletBalance(walletBalance)}
                    </span>
                  )}
                </div>
                <Button size="sm" onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3">
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:text-accent hover:bg-transparent flex items-center gap-2">
                <div className="border rounded p-1">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-sm">Login / Signup</span>
              </Button>
            </Link>
          )}
        </div>

        {/* ✅ Mobile Icons (Cart + Orders + Login) */}
        <div className="flex lg:hidden items-center gap-3">
          {loggedInUser ? (
            <>
              <Link to="/my-orders" className="relative">
                <Package className="h-5 w-5" />
                {badge(ordersCount, loading.orders)}
              </Link>

              <Link to="/cart" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {badge(cartItemsCount, loading.cart)}
              </Link>
            </>
          ) : (
            <Link to="/login">
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-dark border-t border-navy-light">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-4">
              <Link to="/" className="block py-2 hover:text-accent transition" onClick={() => setMobileMenuOpen(false)}>
                HOME
              </Link>
              <Link to="/categories" className="block py-2 hover:text-accent transition" onClick={() => setMobileMenuOpen(false)}>
                CATEGORY
              </Link>

              {/* Mobile Earn dropdown */}
              <div>
                <button
                  className="flex items-center justify-between w-full py-2 hover:text-accent transition"
                  onClick={() => setMobileEarnOpen((v) => !v)}
                >
                  <span>EARN WITH US</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${mobileEarnOpen ? "rotate-90" : ""}`} />
                </button>

                {mobileEarnOpen && (
                  <div className="pl-4 space-y-2 mt-2 border-l border-navy-light">
                    <button className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become a Vendor", "vendor")}>
                      BECOME A VENDOR
                    </button>
                    <button className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become a Franchiser", "franchiser")}>
                      BECOME A FRANCHISER
                    </button>
                    <button className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become a Freelancer", "freelancer")}>
                      BECOME A FREELANCER
                    </button>
                    <button className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become an Entrepreneur", "entrepreneur")}>
                      BECOME AN ENTREPRENEUR
                    </button>
                  </div>
                )}
              </div>

              <Link to="/local-stores" className="block py-2 hover:text-accent transition" onClick={() => setMobileMenuOpen(false)}>
                LOCAL STORES
              </Link>
              <Link to="/referrals" className="block py-2 hover:text-accent transition" onClick={() => setMobileMenuOpen(false)}>
                REFER & EARN
              </Link>
              <Link to="/wishlist" className="block py-2 hover:text-accent transition" onClick={() => setMobileMenuOpen(false)}>
                WISHLIST
              </Link>
            </div>

            {/* User Section - Mobile */}
            <div className="mt-6 pt-6 border-t border-navy-light">
              {loggedInUser ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="font-medium">Hi, {loggedInUser.name || "User"}</span>
                      {walletBalance > 0 && (
                        <span className="text-sm text-green-400">
                          Wallet: {formatWalletBalance(walletBalance)}
                        </span>
                      )}
                    </div>
                    <Button size="sm" onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3">
                      Logout
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Link to="/profile" className="flex items-center py-2 hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}>
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>

                    <Link to="/my-orders" className="flex items-center py-2 hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}>
                      <Package className="h-4 w-4 mr-3" />
                      <span>My Orders</span>
                      {ordersCount > 0 && !loading.orders && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {ordersCount > 9 ? "9+" : ordersCount}
                        </span>
                      )}
                    </Link>

                    <Link to="/cart" className="flex items-center py-2 hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}>
                      <ShoppingBag className="h-4 w-4 mr-3" />
                      <span>My Cart</span>
                      {cartItemsCount > 0 && !loading.cart && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {cartItemsCount > 9 ? "9+" : cartItemsCount}
                        </span>
                      )}
                    </Link>
                  </div>
                </>
              ) : (
                <Link to="/login" className="flex items-center py-3 hover:text-accent transition"
                  onClick={() => setMobileMenuOpen(false)}>
                  <User className="h-5 w-5 mr-3" />
                  <span>Login / Signup</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
