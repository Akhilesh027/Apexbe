import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Fashion from "./pages/Category";
import Sarees from "./pages/Sarees";
import Jewelry from "./pages/Jewelry";
import Grocery from "./pages/Grocery";
import Electronics from "./pages/Electronics";
import Furniture from "./pages/Furniture";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Vendors from "./pages/Vendors";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";
import Sale from "./pages/Sale";
import SuperVendor from "./pages/LocalStores";
import Referrals from "./pages/Referrals";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./components/OrderSuccess";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import Register from "./pages/Register";
import StorePage from "./pages/Vendors";
import ProductsPage from "./pages/Product";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fashion" element={<Fashion />} />
          <Route path="/sarees" element={<Sarees />} />
          <Route path="/jewelry" element={<Jewelry />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/grocery" element={<Grocery />} />
          <Route path="/electronics" element={<Electronics />} />
          <Route path="/furniture" element={<Furniture />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account />} />
          <Route path="/business/:id" element={<StorePage />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/sale" element={<Sale />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/local-stores" element={<SuperVendor />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/categories" element={<Fashion />} />
          <Route path="/category/:categoryName" element={<Fashion />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
