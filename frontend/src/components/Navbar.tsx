import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import logo from '../Web images/Web images/logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setLoggedInUser(userData);
      fetchCartItemsCount(userData._id);
      fetchWalletBalance();
    }
  }, []);

  const fetchCartItemsCount = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://api.apexbee.in/api/cart/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!token || !user) {
        return;
      }

      // Fetch referral stats which includes wallet balance
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
        // Token expired, logout user
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
    navigate("/login");
  };

  // Function to get cart items text
  const getCartItemsText = () => {
    if (cartItemsCount === 0) {
      return "No Items in Bag";
    } else if (cartItemsCount === 1) {
      return "1 Item in Bag";
    } else {
      return `${cartItemsCount} Items in Bag`;
    }
  };

  // Format wallet balance with proper currency formatting
  const formatWalletBalance = (balance) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
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
              <Link to="/referrals" className="hover:text-accent transition">REFERRALS</Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              <Link to='/wishlist' className="hover:text-accent transition">
                <span className="text-xs">Wishlist</span>
              </Link>

              {/* Wallet Balance - Show only when user is logged in */}
              {loggedInUser && (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7 flex items-center gap-1"
                  onClick={() => navigate('/referrals')}
                  title="Click to view referral earnings"
                >
                  <Wallet className="h-3 w-3" />
                  {loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatWalletBalance(walletBalance)
                  )}
                </Button>
              )}

              <Menu className="h-5 w-5 cursor-pointer md:hidden" />
            </div>

          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">

          <Button variant="outline" className="text-foreground bg-white border-0 hover:bg-gray-50">
            <Menu className="h-4 w-4 mr-2" />
            Shop by Category
          </Button>

          {/* Search Bar */}
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

            {/* My Orders */}
            <Link to="/my-orders">
              <Button variant="ghost" className="text-white hover:text-accent hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <div className="border rounded p-1">
                    <div className="text-xs">📋</div>
                  </div>
                  <span className="text-sm">My Orders</span>
                </div>
              </Button>
            </Link>

            {/* Cart with Item Count */}
            <Button variant="ghost" className="text-white hover:text-accent hover:bg-transparent relative">
              <Link to="/cart" className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="border rounded p-1 relative">
                    <ShoppingBag className="h-4 w-4" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm">{getCartItemsText()}</span>
                </div>
              </Link>
            </Button>

            {/* Login / User Profile */}
            {!loggedInUser ? (
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:text-accent hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <div className="border rounded p-1">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Login / Signup</span>
                  </div>
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">

                {/* Show User Name with Wallet Info */}
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

                {/* Logout Button */}
                <Button
                  size="sm"
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3"
                >
                  Logout
                </Button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Menu - Simplified for mobile */}
      <div className="lg:hidden border-t border-navy-light">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {loggedInUser ? (
              <div className="flex items-center gap-4 w-full justify-between">
                <span className="text-sm">Hi, {loggedInUser.name}</span>
                <div className="flex items-center gap-2">
                  {walletBalance > 0 && (
                    <span className="text-xs bg-green-600 px-2 py-1 rounded">
                      {formatWalletBalance(walletBalance)}
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="w-full text-center py-2 hover:text-accent">
                Login / Signup
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;