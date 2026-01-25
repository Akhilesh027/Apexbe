import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

const API_BASE = "https://api.apexbee.in/api";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    referralCode: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlReferralCode = searchParams.get("ref");

  useEffect(() => {
    if (urlReferralCode) {
      setFormData((prev) => ({ ...prev, referralCode: urlReferralCode }));
    }
  }, [urlReferralCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        setError("Please fill in all required fields.");
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          referralCode: formData.referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Registration failed. Please try again.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      });

      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      console.error("Register error:", err);
      setError("Server error, try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero (same style/background as Login) */}
      <section className="relative overflow-hidden bg-navy-dark">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-14">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            {/* Left info (match login tone) */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-sm">
                <ShieldCheck className="w-4 h-4" />
                Create account • Secure signup
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mt-5 leading-tight">
                Create your ApexBee account
              </h1>

              <p className="text-white/80 mt-3 max-w-md">
                Set up your profile, access member features, and start tracking your
                activity in one place.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-white/90">
                <li className="flex items-center gap-2">✅ Quick signup in under a minute</li>
                <li className="flex items-center gap-2">✅ Secure access with token-based login</li>
                <li className="flex items-center gap-2">✅ Referral support built-in</li>
              </ul>

              {urlReferralCode && (
                <div className="mt-7 p-4 rounded-xl bg-white/10 border border-white/15">
                  <p className="text-sm text-white/90">
                    Referral detected! Your code will be applied automatically when you sign up.
                  </p>
                  <p className="text-xs text-white/70 mt-2">
                    Code: <span className="font-semibold text-white">{urlReferralCode}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Right card (same structure as login card) */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-navy">Create Account</h2>
                  {urlReferralCode ? (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                      Referral Applied
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary/60 text-muted-foreground border border-gray-200">
                      New User
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  Enter your details to get started.
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
                  {error && (
                    <div
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Input
                      type="text"
                      name="name"
                      placeholder="Full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full"
                      required
                    />

                    <Input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full"
                      required
                    />

                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full"
                      required
                    />

                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password (min 6 characters)"
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

                    {/* referral is optional; auto-filled from URL if present */}
                    <Input
                      type="text"
                      name="referralCode"
                      placeholder="Referral code (optional)"
                      value={formData.referralCode}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-5 bg-accent hover:bg-accent/90 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  <div className="text-center text-sm mt-6">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <Link to="/login" className="text-accent hover:underline font-medium">
                      Login
                    </Link>
                  </div>
                </form>
              </div>

              <div className="px-6 md:px-8 py-4 bg-secondary/30 border-t border-gray-200">
                <p className="text-xs text-muted-foreground text-center">
                  By creating an account, you agree to our Terms & Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
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

export default Register;
