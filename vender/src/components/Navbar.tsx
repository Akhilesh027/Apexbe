import { Search, ShoppingBag, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const Navbar = () => {
  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-xl font-bold">Logo</div>
          <span className="text-sm">E commerce</span>
        </Link>

        <div className="flex-1 max-w-2xl relative">
          <Input
            type="search"
            placeholder="Search for a Product or Brand..."
            className="w-full bg-white text-foreground pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/90">
            <ShoppingBag className="h-5 w-5 mr-2" />
            My Orders
          </Button>
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/90">
            <ShoppingBag className="h-5 w-5 mr-2" />
            Items in Bag
          </Button>
          <Link to="/profile">
            <Button variant="secondary" className="rounded-full">
              <User className="h-4 w-4 mr-2" />
              Vendor Profile
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-primary-foreground lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
