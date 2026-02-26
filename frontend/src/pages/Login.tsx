import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, ShieldCheck, Mail } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

const API_BASE = "https://api.apexbee.in/api";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlReferralCode = searchParams.get("ref");

  const saveSession = (data: any) => {
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        setError("Please enter both email and password.");
        return;
      }

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Login failed.");
        return;
      }

      saveSession(data);

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });

      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error, try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError("");
    setGoogleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential,
          referralCode: urlReferralCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Google login failed.");
        return;
      }

      saveSession(data);

      toast({
        title: "Logged in with Google",
        description: "Welcome to ApexBee!",
      });

      setTimeout(() => navigate("/"), 500);
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const goToForgotPassword = () => {
    const email = formData.email.trim();
    navigate(email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-navy-dark">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-14">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-sm">
                <ShieldCheck className="w-4 h-4" />
                Secure login • Encrypted sessions
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mt-5 leading-tight">
                Welcome back to ApexBee
              </h1>

              <p className="text-white/80 mt-3 max-w-md">
                Access your dashboard, manage referrals, track rewards, and explore everything waiting
                for you inside your account.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-white/90">
                <li className="flex items-center gap-2">✅ Private & protected account access</li>
                <li className="flex items-center gap-2">✅ Track referrals and performance</li>
                <li className="flex items-center gap-2">✅ Personalized tools & insights</li>
              </ul>

              {urlReferralCode && (
                <div className="mt-7 p-4 rounded-xl bg-white/10 border border-white/15">
                  <p className="text-sm text-white/90">
                    You arrived through a referral invitation. New here? Create an account to get
                    started with your friend.
                  </p>

                  <Link
                    to={`/register?ref=${encodeURIComponent(urlReferralCode)}`}
                    className="inline-block mt-3 text-sm font-semibold text-white underline underline-offset-4"
                  >
                    Create your account with referral →
                  </Link>
                </div>
              )}
            </div>

            {/* Right card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-navy">Welcome Back</h2>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    Login
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  Continue with Google or use your email & password.
                </p>

                {/* Google Login */}
                <div className="mt-5">
                  <div className={`rounded-lg ${googleLoading ? "opacity-60 pointer-events-none" : ""}`}>
                    <GoogleLogin
                      onSuccess={(cred) => {
                        const token = cred?.credential;
                        if (token) handleGoogleSuccess(token);
                        else setError("Google did not return credential. Try again.");
                      }}
                      onError={() => setError("Google login cancelled or failed.")}
                      useOneTap={false}
                    />
                  </div>

                  {googleLoading && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Signing in with Google...
                    </div>
                  )}

                  <div className="flex items-center gap-3 my-5">
                    <div className="h-px bg-gray-200 flex-1" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <div className="h-px bg-gray-200 flex-1" />
                  </div>
                </div>

                {/* Email login */}
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full"
                      required
                    />

                    <div className="relative">
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
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={goToForgotPassword}
                        className="text-sm text-accent hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-5 bg-accent hover:bg-accent/90 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>

                  <div className="text-center text-sm mt-6">
                    <span className="text-muted-foreground">New here? </span>
                    <Link
                      to={
                        urlReferralCode
                          ? `/register?ref=${encodeURIComponent(urlReferralCode)}`
                          : "/register"
                      }
                      className="text-accent hover:underline font-medium"
                    >
                      Create an account
                    </Link>
                  </div>
                </form>
              </div>

              <div className="px-6 md:px-8 py-4 bg-secondary/30 border-t border-gray-200">
                <p className="text-xs text-muted-foreground text-center">
                  By continuing, you agree to our Terms & Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>

        <svg
          className="block w-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ height: "80px" }}
        >
          <path
            d="M0,0 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z"
            className="fill-white"
          />
        </svg>
      </section>

      <Footer />
    </div>
  );
};

export default Login;