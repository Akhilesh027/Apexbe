import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import logo from '../Web images/Web images/logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setLoggedInUser(userData);
      fetchCartItemsCount(userData._id);
    }
  }, []);

  const fetchCartItemsCount = async (userId) => {
    try {
      const response = await fetch(`https://website-backend-57f9.onrender.com/api/cart/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.cart && data.cart.items) {
          // Calculate total quantity of all items in cart
          const totalItems = data.cart.items.reduce((total, item) => total + item.quantity, 0);
          setCartItemsCount(totalItems);
        }
      }
    } catch (error) {
      console.error("Error fetching cart items count:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setLoggedInUser(null);
    setCartItemsCount(0);
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
              <Link to="/sale" className="hover:text-accent transition">SALE</Link>
              <Link to="/vendors" className="hover:text-accent transition">VENDORS</Link>
              <Link to="/super-vendor" className="hover:text-accent transition">SUPER VENDOR</Link>
              <Link to="/referrals" className="hover:text-accent transition">REFERRALS</Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              <Link to='wishlist' className="hover:text-accent transition">
              <span className="text-xs">Wishlist</span>
              </Link>

              <Button size="sm" className="bg-accent hover:bg-accent-dark text-white text-xs px-3 py-1 h-7">
                Rs. 512
              </Button>

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

                {/* Show User Name */}
                <Link to="/profile" className="text-sm hover:text-accent transition">
                 <span className="text-sm font-medium">
                  Hi, {loggedInUser.name || "User"}
                </span>
                </Link>

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
    </nav>
  );
};

export default Navbar;