import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Login = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setError("");
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    let url = "";
    let payload = {};

    // ----------------------------
    // 🔵 LOGIN (EMAIL + PHONE)
    // ----------------------------
    if (activeTab === "login") {
      if (authMethod === "email") {
        if (!formData.email || !formData.password) {
          setError("Please enter both email and password.");
          return;
        }

        url = "https://api.apexbee.in/api/login/email";
        payload = {
          email: formData.email,
          password: formData.password,
        };
      } else {
        if (!formData.phone) {
          setError("Please enter your phone number.");
          return;
        }

        url = "https://api.apexbee.in/api/login/phone";
        payload = {
          phone: formData.phone,
        };
      }
    }

    // ----------------------------
    // 🔵 REGISTER
    // ----------------------------
    else {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        setError("Please fill in all fields.");
        return;
      }

      url = "https://api.apexbee.in/api/auth/register";
      payload = formData;
    }

    // ----------------------------
    // 🔥 SEND REQUEST
    // ----------------------------
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    // ----------------------------
    // 💾 SAVE USER + TOKEN
    // ----------------------------
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);

    // ----------------------------
    // 🚀 REDIRECT
    // ----------------------------
    window.location.href = "/";

  } catch (err) {
    setError("Server error, try again later.");
  }
};


  const renderFormContent = () => {
    if (activeTab === "register") {
      // Registration Form
      return (
        <>
          <h2 className="text-xl font-semibold text-navy mb-4 text-center">Create Your Account</h2>
          <Input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full mb-3"
          />
          <Input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full mb-3"
          />
          <Input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full mb-3"
          />
          <Input
            type="password"
            name="password"
            placeholder="Password (Min. 6 characters)"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full mb-6"
          />
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white">
            Register Account
          </Button>
        </>
      );
    } else {
      // Login Form
      return (
        <>
          <h2 className="text-xl font-semibold text-navy mb-4 text-center">Welcome Back!</h2>
          
          <div className="flex justify-center mb-6">
            <Button
              variant={authMethod === "phone" ? "default" : "outline"}
              onClick={() => setAuthMethod("phone")}
              className={`mr-2 ${authMethod === "phone" ? "bg-navy text-white" : "border-navy text-navy"}`}
            >
              Login with Phone
            </Button>
            <Button
              variant={authMethod === "email" ? "default" : "outline"}
              onClick={() => setAuthMethod("email")}
              className={authMethod === "email" ? "bg-navy text-white" : "border-navy text-navy"}
            >
              Login with Email
            </Button>
          </div>

          {authMethod === "phone" ? (
            <div className="mb-6">
              <Input
                type="tel"
                name="phone"
                placeholder="Enter Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full text-center"
              />
            </div>
          ) : (
            <>
              <Input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full mb-3"
              />
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full mb-6"
              />
              <div className="text-right mb-4">
                <Link to="#" className="text-sm text-accent hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </>
          )}

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white mb-4">
            {authMethod === "phone" ? "Proceed (Send OTP)" : "Login"}
          </Button>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Referral Banner */}
      <div className="bg-accent text-white text-center py-3">
        <h2 className="text-xl font-bold">Refer Friends and Earn Upto Rs. 400</h2>
      </div>

      {/* Wave Background */}
      <div className="relative bg-navy-dark min-h-[600px] flex items-center justify-center">
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ height: '120px' }}
        >
          <path
            d="M0,0 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z"
            className="fill-white"
          />
        </svg>

        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Tabs */}
            <div className="grid grid-cols-2">
              <button
                onClick={() => { setActiveTab("login"); setAuthMethod("phone"); setFormData({name: "", email: "", phone: "", password: ""}); }}
                className={`py-4 text-center font-semibold transition-colors ${
                  activeTab === "login"
                    ? "bg-navy text-white"
                    : "bg-white text-navy hover:bg-gray-50"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => { setActiveTab("register"); setAuthMethod("email"); setFormData({name: "", email: "", phone: "", password: ""}); }}
                className={`py-4 text-center font-semibold transition-colors ${
                  activeTab === "register"
                    ? "bg-navy text-white"
                    : "bg-white text-navy hover:bg-gray-50"
                }`}
              >
                Register
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-8 bg-secondary/30">
              
              {/* Error Message Display */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  {error}
                </div>
              )}

              {/* Social Login (Only show on Login tab for simplicity) */}
              {activeTab === "login" && (
                <>
                  <div className="space-y-3 mb-6">
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50"
                      onClick={(e) => { e.preventDefault(); console.log('Facebook Login Clicked'); }}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50"
                      onClick={(e) => { e.preventDefault(); console.log('Google Login Clicked'); }}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                  </div>
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-secondary/30 text-muted-foreground">-OR-</span>
                    </div>
                  </div>
                </>
              )}
              
              {renderFormContent()}
              
              {/* Toggle to other tab (Only show on Login tab for clarity) */}
              {activeTab === "login" && (
                <div className="text-center text-sm mt-4">
                  <span className="text-muted-foreground">New User? </span>
                  <Link 
                    to="#" 
                    onClick={() => { setActiveTab("register"); setFormData({name: "", email: "", phone: "", password: ""}); }} 
                    className="text-accent hover:underline"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Offer Banners */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-accent rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-accent mb-2">Rs. 250</p>
            <p className="text-navy">On first shopping</p>
          </div>
          <div className="border-2 border-accent rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-accent mb-2">Rs. 500</p>
            <p className="text-navy">On self for App Download</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Login;