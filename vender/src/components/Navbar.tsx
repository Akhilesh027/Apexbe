import { useEffect, useState } from "react";
import { Search, ShoppingBag, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const Navbar = () => {
  const [businessName, setBusinessName] = useState("");
  const [businessLogo, setBusinessLogo] = useState("");

  useEffect(() => {
    setBusinessName(localStorage.getItem("businessName") || "E Commerce");
    setBusinessLogo(localStorage.getItem("businessLogo") || "");
  }, []);

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">

        {/* LEFT SECTION -> LOGO + BUSINESS NAME */}
        <Link to="/" className="flex items-center gap-2">
          {businessLogo ? (
            <img
              src={businessLogo}
              alt="Business Logo"
              className="w-10 h-10 rounded-full object-cover border"
            />
          ) : (
            <div className="text-xl font-bold">Logo</div>
          )}

          <span className="text-sm font-semibold">{businessName}</span>
        </Link>

        {/* SEARCH BAR */}
        <div className="flex-1 max-w-2xl relative hidden md:block">
          <Input
            type="search"
            placeholder="Search for a Product or Brand..."
            className="w-full bg-white text-foreground pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        {/* RIGHT SIDE BUTTONS */}
        <div className="flex items-center gap-4">
          <Link to='/orders'>
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/90">
            <ShoppingBag className="h-5 w-5 mr-2" />
            new orders
          </Button></Link>

        <Link to='/orders'>
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/90">
            <ShoppingBag className="h-5 w-5 mr-2" />
            pending orders
          </Button></Link>

          <Link to="/profile">
            <Button variant="secondary" className="rounded-full">
              <User className="h-4 w-4 mr-2" />
              Vendor Profile
            </Button>
          </Link>

          {/* MOBILE MENU ICON */}
          <Button variant="ghost" size="icon" className="text-primary-foreground lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
