import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, Wallet, ChevronDown, X, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useEffect, useState, useCallback } from "react";
import logo from '../Web images/Web images/logo.png';
import FormModal from "./FormModal.tsx";

const Navbar = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState({
    wallet: false,
    cart: false,
    orders: false
  });
  const [earnDropdownOpen, setEarnDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalEndpoint, setModalEndpoint] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileEarnOpen, setMobileEarnOpen] = useState(false);

  const handleOpenForm = (title, endpoint) => {
    setModalTitle(title);
    setModalEndpoint(endpoint);
    setModalOpen(true);
    setEarnDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileEarnOpen(false);
  };

  // Fetch user data from localStorage
  const getUserData = useCallback(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    return { user: user ? JSON.parse(user) : null, token };
  }, []);

  // Fetch cart items count
  const fetchCartItemsCount = useCallback(async (userId, token) => {
    if (!userId || !token) return;
    
    try {
      setLoading(prev => ({ ...prev, cart: true }));
      const response = await fetch(`https://api.apexbee.in/api/cart/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.cart && data.cart.items) {
          const totalItems = data.cart.items.reduce((total, item) => total + item.quantity, 0);
          setCartItemsCount(totalItems);
        } else {
          setCartItemsCount(0);
        }
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching cart items count:", error);
      setCartItemsCount(0);
    } finally {
      setLoading(prev => ({ ...prev, cart: false }));
    }
  }, []);

  // Fetch orders count
  const fetchOrdersCount = useCallback(async (userId, token) => {
    if (!userId || !token) return;
    
    try {
      setLoading(prev => ({ ...prev, orders: true }));
      const response = await fetch(`https://api.apexbee.in/api/orders/${userId}/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrdersCount(data.count || 0);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching orders count:", error);
      setOrdersCount(0);
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  }, []);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async (token) => {
    if (!token) return;
    
    try {
      setLoading(prev => ({ ...prev, wallet: true }));
      const response = await fetch(`https://api.apexbee.in/api/referrals/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.walletBalance || 0);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalance(0);
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  }, []);

  // Fetch all user data
  const fetchUserData = useCallback(async () => {
    const { user, token } = getUserData();
    
    if (user && token) {
      setLoggedInUser(user);
      await Promise.all([
        fetchCartItemsCount(user._id, token),
        fetchOrdersCount(user._id, token),
        fetchWalletBalance(token)
      ]);
    } else {
      setLoggedInUser(null);
      setCartItemsCount(0);
      setWalletBalance(0);
      setOrdersCount(0);
    }
  }, [getUserData, fetchCartItemsCount, fetchOrdersCount, fetchWalletBalance]);

  // Initial load and setup storage listener
  useEffect(() => {
    fetchUserData();

    // Listen for storage changes (e.g., when user logs in/out from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        fetchUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUserData]);

  // Refresh cart count more frequently if user is logged in
  useEffect(() => {
    if (!loggedInUser) return;

    const { user, token } = getUserData();
    if (!user || !token) return;

    // Refresh cart count every 30 seconds when user is logged in
    const interval = setInterval(() => {
      fetchCartItemsCount(user._id, token);
    }, 30000);

    return () => clearInterval(interval);
  }, [loggedInUser, fetchCartItemsCount, getUserData]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setLoggedInUser(null);
    setCartItemsCount(0);
    setWalletBalance(0);
    setOrdersCount(0);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const formatWalletBalance = (balance) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(balance);
  };

  return (
    <nav className="bg-navy-dark text-white sticky top-0 z-50">
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
              <Link to="/category" className="hover:text-accent transition">CATEGORY</Link>

              {/* Earn With Us Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 hover:text-accent hover:bg-transparent"
                  onClick={() => setEarnDropdownOpen(!earnDropdownOpen)}
                >
                  EARN WITH US <ChevronDown className="h-4 w-4" />
                </Button>
                {earnDropdownOpen && (
                  <div className="absolute top-full left-0 bg-white text-black rounded shadow-lg mt-1 w-56 z-50">
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleOpenForm("Become a Vendor", "vendor")}
                    >
                      BECOME A VENDOR
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleOpenForm("Become a Franchiser", "franchiser")}
                    >
                      BECOME A FRANCHISER
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleOpenForm("Become a Freelancer", "freelancer")}
                    >
                      BECOME A FREELANCER
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleOpenForm("Become an Entrepreneur", "entrepreneur")}
                    >
                      BECOME AN ENTREPRENEUR
                    </button>
                  </div>
                )}
              </div>

              <Link to="/local" className="hover:text-accent transition">LOCAL STORES</Link>
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
              <Link to='/wishlist' className="hidden sm:block hover:text-accent transition text-xs">Wishlist</Link>

              {loggedInUser && (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7 flex items-center gap-1"
                  onClick={() => navigate('/referrals')}
                  title="Click to view referral earnings"
                  disabled={loading.wallet}
                >
                  <Wallet className="h-3 w-3" />
                  {loading.wallet ? <span className="animate-pulse">...</span> : formatWalletBalance(walletBalance)}
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 cursor-pointer" />
                ) : (
                  <Menu className="h-6 w-6 cursor-pointer" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <Button variant="outline" className="text-foreground bg-white border-0 hover:bg-gray-50">
          <Menu className="h-4 w-4 mr-2" />
          Shop by Category
        </Button>

        <div className="flex-1 relative max-w-2xl">
          <Input
            type="text"
            placeholder="Search for a Product or Brand..."
            className="w-full bg-white text-foreground pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {/* User Section - Desktop */}
        <div className="hidden lg:flex items-center gap-4">
          {loggedInUser ? (
            <>
              <Link to="/my-orders">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-accent hover:bg-transparent relative flex items-center gap-2"
                  disabled={loading.orders}
                >
                  <div className="border rounded p-1 text-xs">📋</div>
                  <span className="text-sm">My Orders</span>
                  {ordersCount > 0 && !loading.orders && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {ordersCount > 9 ? '9+' : ordersCount}
                    </span>
                  )}
                  {loading.orders && (
                    <span className="absolute -top-2 -right-2 bg-gray-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      ...
                    </span>
                  )}
                </Button>
              </Link>

              <Link to="/cart">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-accent hover:bg-transparent relative flex items-center gap-2"
                  disabled={loading.cart}
                >
                  <div className="border rounded p-1 relative">
                    <ShoppingBag className="h-4 w-4" />
                    {cartItemsCount > 0 && !loading.cart && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                      </span>
                    )}
                    {loading.cart && (
                      <span className="absolute -top-2 -right-2 bg-gray-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        ...
                      </span>
                    )}
                  </div>
                  Cart
                </Button>
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <Link to="/profile" className="text-sm hover:text-accent transition font-medium">
                    Hi, {loggedInUser.name || "User"}
                  </Link>
                  {walletBalance > 0 && (
                    <span className="text-xs text-green-400">Wallet: {formatWalletBalance(walletBalance)}</span>
                  )}
                </div>
                <Button 
                  size="sm" 
                  onClick={handleLogout} 
                  className="bg-red-500 hover:bg-red-600 text-white px-3"
                >
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:text-accent hover:bg-transparent flex items-center gap-2">
                <div className="border rounded p-1"><User className="h-4 w-4" /></div>
                <span className="text-sm">Login / Signup</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Cart and Login Icons */}
        <div className="flex lg:hidden items-center gap-3">
          {loggedInUser && (
            <Link to="/cart" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && !loading.cart && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
            </Link>
          )}
          {!loggedInUser && (
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
            {/* Navigation Links */}
            <div className="space-y-4">
              <Link 
                to="/" 
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                HOME
              </Link>
              <Link 
                to="/category" 
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                CATEGORY
              </Link>
              
              {/* Mobile Earn With Us Dropdown */}
              <div>
                <button
                  className="flex items-center justify-between w-full py-2 hover:text-accent transition"
                  onClick={() => setMobileEarnOpen(!mobileEarnOpen)}
                >
                  <span>EARN WITH US</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${mobileEarnOpen ? 'rotate-90' : ''}`} />
                </button>
                {mobileEarnOpen && (
                  <div className="pl-4 space-y-2 mt-2 border-l border-navy-light">
                    <button
                      className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become a Vendor", "vendor")}
                    >
                      BECOME A VENDOR
                    </button>
                    <button
                      className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become a Franchiser", "franchiser")}
                    >
                      BECOME A FRANCHISER
                    </button>
                    <button
                      className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become a Freelancer", "freelancer")}
                    >
                      BECOME A FREELANCER
                    </button>
                    <button
                      className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become an Entrepreneur", "entrepreneur")}
                    >
                      BECOME AN ENTREPRENEUR
                    </button>
                  </div>
                )}
              </div>

              <Link 
                to="/local" 
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                LOCAL STORES
              </Link>
              <Link 
                to="/referrals" 
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                REFER & EARN
              </Link>
              <Link 
                to="/wishlist" 
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
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
                        <span className="text-sm text-green-400">Wallet: {formatWalletBalance(walletBalance)}</span>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleLogout} 
                      className="bg-red-500 hover:bg-red-600 text-white px-3"
                    >
                      Logout
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <Link 
                      to="/profile"
                      className="flex items-center py-2 hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>
                    <Link 
                      to="/my-orders"
                      className="flex items-center py-2 hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="border rounded p-1 text-xs mr-3">📋</div>
                      <span>My Orders</span>
                      {ordersCount > 0 && !loading.orders && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {ordersCount > 9 ? '9+' : ordersCount}
                        </span>
                      )}
                    </Link>
                    <Link 
                      to="/cart"
                      className="flex items-center py-2 hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-3" />
                      <span>My Cart</span>
                      {cartItemsCount > 0 && !loading.cart && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {cartItemsCount > 9 ? '9+' : cartItemsCount}
                        </span>
                      )}
                    </Link>
                  </div>
                </>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center py-3 hover:text-accent transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
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