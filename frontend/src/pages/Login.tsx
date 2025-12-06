import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const Login = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    referralCode: ""
  });
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlReferralCode = searchParams.get('ref');

  useState(() => {
    if (urlReferralCode) {
      setFormData(prev => ({ ...prev, referralCode: urlReferralCode }));
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let url = "";
      let payload: any = {};

      if (activeTab === "login") {
        // ----------------------------
        // 🔵 LOGIN WITH EMAIL
        // ----------------------------
        if (authMethod === "email") {
          if (!formData.email || !formData.password) {
            setError("Please enter both email and password.");
            setLoading(false);
            return;
          }

          url = "https://api.apexbee.in/api/auth/login";
          payload = {
            email: formData.email,
            password: formData.password,
          };
        } 
        // ----------------------------
        // 🔵 LOGIN WITH PHONE (OTP)
        // ----------------------------
        else {
          if (!formData.phone) {
            setError("Please enter your phone number.");
            setLoading(false);
            return;
          }

          // For phone login, we'll simulate OTP send
          url = "https://api.apexbee.in/api/auth/phone-login";
          payload = {
            phone: formData.phone,
          };
          
          // Simulate OTP send (you'll need to implement this endpoint)
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            toast({
              title: "OTP Sent!",
              description: "Check your phone for the verification code",
            });
            // Redirect to OTP verification page
            navigate(`/verify-otp?phone=${formData.phone}`);
            return;
          } else {
            const data = await res.json();
            setError(data.error || "Failed to send OTP");
            return;
          }
        }
      } else {
        // ----------------------------
        // 🔵 REGISTER
        // ----------------------------
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
          setError("Please fill in all fields.");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }

        url = "https://api.apexbee.in/api/auth/register";
        payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          referralCode: formData.referralCode || undefined
        };
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
        setLoading(false);
        return;
      }

      // ----------------------------
      // 💾 SAVE USER + TOKEN
      // ----------------------------
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      // Show success message
      toast({
        title: activeTab === "login" ? "Welcome back!" : "Account created!",
        description: activeTab === "login" 
          ? "You have successfully logged in" 
          : "Your account has been created successfully",
      });

      // ----------------------------
      // 🚀 REDIRECT
      // ----------------------------
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (err) {
      setError("Server error, try again later.");
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    toast({
      title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Login`,
      description: `Redirecting to ${provider} authentication...`,
    });
    // Implement social login logic here
    console.log(`${provider} login clicked`);
  };

  const renderFormContent = () => {
    if (activeTab === "register") {
      // Registration Form
      return (
        <>
          <h2 className="text-xl font-semibold text-navy mb-4 text-center">Create Your Account</h2>
          
          {urlReferralCode && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm text-center">
                🎉 You're joining with a referral! Both you and your friend will earn rewards.
              </p>
            </div>
          )}

          <Input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full mb-3"
            required
          />
          <Input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full mb-3"
            required
          />
          <Input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full mb-3"
            required
          />
          <div className="relative mb-3">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password (Min. 6 characters)"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pr-10"
              required
              minLength={6}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
          
          <Input
            type="text"
            name="referralCode"
            placeholder="Referral Code (Optional)"
            value={formData.referralCode}
            onChange={handleInputChange}
            className="w-full mb-6"
          />
          
          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Register Account"
            )}
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
              type="button"
            >
              Login with Phone
            </Button>
            <Button
              variant={authMethod === "email" ? "default" : "outline"}
              onClick={() => setAuthMethod("email")}
              className={authMethod === "email" ? "bg-navy text-white" : "border-navy text-navy"}
              type="button"
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
                required
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                We'll send you an OTP to verify your number
              </p>
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
                required
              />
              <div className="relative mb-3">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              <div className="text-right mb-4">
                <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </>
          )}

          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90 text-white mb-4"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {authMethod === "phone" ? "Sending OTP..." : "Logging in..."}
              </>
            ) : (
              authMethod === "phone" ? "Send OTP" : "Login"
            )}
          </Button>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Referral Banner */}
      <div className="bg-gradient-to-r from-navy to-accent text-white text-center py-3">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold flex items-center justify-center gap-2">
            <span className="bg-white text-accent rounded-full p-1">🎁</span>
            Refer Friends and Earn Up to Rs. 400
            <span className="bg-white text-accent rounded-full p-1">💰</span>
          </h2>
          <p className="text-sm opacity-90 mt-1">Share your referral code and earn Rs. 50 per successful referral!</p>
        </div>
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
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
            {/* Tabs */}
            <div className="grid grid-cols-2">
              <button
                onClick={() => { 
                  setActiveTab("login"); 
                  setAuthMethod("phone"); 
                  setFormData({name: "", email: "", phone: "", password: "", referralCode: urlReferralCode || ""}); 
                }}
                className={`py-4 text-center font-semibold transition-colors ${
                  activeTab === "login"
                    ? "bg-navy text-white"
                    : "bg-white text-navy hover:bg-gray-50"
                }`}
                type="button"
              >
                Login
              </button>
              <button
                onClick={() => { 
                  setActiveTab("register"); 
                  setAuthMethod("email"); 
                  setFormData({name: "", email: "", phone: "", password: "", referralCode: urlReferralCode || ""}); 
                }}
                className={`py-4 text-center font-semibold transition-colors ${
                  activeTab === "register"
                    ? "bg-navy text-white"
                    : "bg-white text-navy hover:bg-gray-50"
                }`}
                type="button"
              >
                Register
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-8 bg-secondary/30">
              
              {/* Error Message Display */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm" role="alert">
                  {error}
                </div>
              )}
  
              {renderFormContent()}
              {/* Social Login (Only show on Login tab for simplicity) */}
              {activeTab === "login" && (
                <>
                  <div className="space-y-3 mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 border-blue-500 text-blue-600"
                      onClick={() => handleSocialLogin('facebook')}
                      disabled={loading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Continue with Facebook
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 border-red-500 text-red-600"
                      onClick={() => handleSocialLogin('google')}
                      disabled={loading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>
                  </div>
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-secondary/30 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                </>
              )}
            
              
              {/* Toggle to other tab */}
              <div className="text-center text-sm mt-4">
                <span className="text-muted-foreground">
                  {activeTab === "login" ? "New User? " : "Already have an account? "}
                </span>
                <button 
                  type="button"
                  onClick={() => { 
                    setActiveTab(activeTab === "login" ? "register" : "login"); 
                    setFormData({name: "", email: "", phone: "", password: "", referralCode: urlReferralCode || ""}); 
                  }} 
                  className="text-accent hover:underline font-medium"
                >
                  {activeTab === "login" ? "Create Account" : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Offer Banners */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="border-2 border-accent rounded-lg p-6 text-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-accent mb-2">Rs. 100</div>
            <p className="text-navy font-medium">For you and your friend</p>
            <p className="text-sm text-muted-foreground mt-2">When your friend makes their first purchase</p>
          </div>
          <div className="border-2 border-accent rounded-lg p-6 text-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-accent mb-2">Rs. 400</div>
            <p className="text-navy font-medium">Maximum earnings</p>
            <p className="text-sm text-muted-foreground mt-2">Refer multiple friends and earn more!</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Login;