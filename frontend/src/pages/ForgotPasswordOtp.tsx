import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://api.apexbee.in/api";

type Step = "email" | "otp" | "newpass";

export default function ForgotPasswordOtp() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password-otp/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Failed", description: data?.error || "Could not send OTP.", variant: "destructive" });
        return;
      }

      toast({ title: "OTP Sent", description: "Check your email for the OTP." });
      setStep("otp");
    } catch (e) {
      toast({ title: "Server error", description: "Try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-otp/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Invalid OTP", description: data?.error || "OTP verification failed.", variant: "destructive" });
        return;
      }

      toast({ title: "Verified", description: "OTP verified. Set your new password." });
      setStep("newpass");
    } catch (e) {
      toast({ title: "Server error", description: "Try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password-otp/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Failed", description: data?.error || "Could not update password.", variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Password updated. Please login." });
      navigate("/login");
    } catch (e) {
      toast({ title: "Server error", description: "Try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm">
                <ShieldCheck className="w-4 h-4" />
                Password Recovery
              </div>

              <h1 className="text-2xl font-semibold text-navy mt-4">
                {step === "email" && "Send OTP to Email"}
                {step === "otp" && "Verify OTP"}
                {step === "newpass" && "Set New Password"}
              </h1>

              <p className="text-sm text-muted-foreground mt-2">
                {step === "email" && "Enter your email to receive an OTP."}
                {step === "otp" && "Enter the 6-digit OTP sent to your email."}
                {step === "newpass" && "Create a new password for your account."}
              </p>

              <div className="mt-6 space-y-4">
                {(step === "email" || step === "otp" || step === "newpass") && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy">Email</label>
                    <div className="relative">
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        type="email"
                        disabled={step !== "email"} // lock email after step 1
                        className="pl-10"
                      />
                      <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {step === "otp" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy">OTP</label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      inputMode="numeric"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-accent px-0"
                      disabled={loading}
                      onClick={sendOtp}
                    >
                      Resend OTP
                    </Button>
                  </div>
                )}

                {step === "newpass" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy">New Password</label>
                    <div className="relative">
                      <Input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        type="password"
                        className="pl-10"
                      />
                      <KeyRound className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-xs text-muted-foreground">Min 6 characters</p>
                  </div>
                )}

                {step === "email" && (
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                    onClick={sendOtp}
                    disabled={loading || !email.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                )}

                {step === "otp" && (
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                    onClick={verifyOtp}
                    disabled={loading || otp.trim().length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                )}

                {step === "newpass" && (
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                    onClick={updatePassword}
                    disabled={loading || newPassword.length < 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="px-6 md:px-8 py-4 bg-secondary/30 border-t border-gray-200">
              <p className="text-xs text-muted-foreground text-center">
                By continuing, you agree to our Terms & Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        <svg className="block w-full" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ height: "80px" }}>
          <path
            d="M0,0 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z"
            className="fill-white"
          />
        </svg>
      </section>

      <Footer />
    </div>
  );
}