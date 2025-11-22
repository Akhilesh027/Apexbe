import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, Wallet, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import logo from '../Web images/Web images/logo.png';
import FormModal from "./FormModal.tsx"; // import modal

const Navbar = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [earnDropdownOpen, setEarnDropdownOpen] = useState(false); // Dropdown state

// Inside Navbar component
const [modalOpen, setModalOpen] = useState(false);
const [modalTitle, setModalTitle] = useState("");
const [modalEndpoint, setModalEndpoint] = useState("");

const handleOpenForm = (title, endpoint) => {
  setModalTitle(title);
  setModalEndpoint(endpoint);
  setModalOpen(true);
};

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setLoggedInUser(userData);
      fetchCartItemsCount(userData._id);
      fetchWalletBalance();
      fetchOrdersCount(userData._id);
    }
  }, []);

  const fetchCartItemsCount = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(`https://api.apexbee.in/api/cart/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.cart && data.cart.items) {
          const totalItems = data.cart.items.reduce((total, item) => total + item.quantity, 0);
          setCartItemsCount(totalItems);
        }
      }
    } catch (error) {
      console.error("Error fetching cart items count:", error);
    }
  };

  const fetchOrdersCount = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(`https://api.apexbee.in/api/orders/${userId}/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrdersCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching orders count:", error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      if (!token || !user) return;

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
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setLoggedInUser(null);
    setCartItemsCount(0);
    setWalletBalance(0);
    setOrdersCount(0);
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
              <Link to='/wishlist' className="hover:text-accent transition text-xs">Wishlist</Link>

              {loggedInUser && (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7 flex items-center gap-1"
                  onClick={() => navigate('/referrals')}
                  title="Click to view referral earnings"
                >
                  <Wallet className="h-3 w-3" />
                  {loading ? <span className="animate-pulse">...</span> : formatWalletBalance(walletBalance)}
                </Button>
              )}

              <Menu className="h-5 w-5 cursor-pointer md:hidden" />
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

        {/* User Section */}
        <div className="hidden lg:flex items-center gap-4">
          {loggedInUser ? (
            <>
              <Link to="/my-orders">
                <Button variant="ghost" className="text-white hover:text-accent hover:bg-transparent relative flex items-center gap-2">
                  <div className="border rounded p-1 text-xs">📋</div>
                  <span className="text-sm">My Orders</span>
                  {ordersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {ordersCount > 9 ? '9+' : ordersCount}
                    </span>
                  )}
                </Button>
              </Link>

              <Link to="/cart">
                <Button variant="ghost" className="text-white hover:text-accent hover:bg-transparent relative flex items-center gap-2">
                  <div className="border rounded p-1 relative">
                    <ShoppingBag className="h-4 w-4" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                      </span>
                    )}
                  </div>
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
                <Button size="sm" onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3">Logout</Button>
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
      </div>
    </nav>
  );
};

export default Navbar;
