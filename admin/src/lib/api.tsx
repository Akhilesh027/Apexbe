// src/lib/api.ts
// Replace this with your real backend endpoints
export const mockLogin = async (email: string, password: string) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Demo credentials
  if (email === "admin@example.com" && password === "admin123") {
    return { token: "fake-jwt-token" };
  }
  throw new Error("Invalid email or password");
};

export const mockRegister = async (email: string, password: string) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simple validation – email must contain '@' and password length >= 6
  if (!email.includes("@")) {
    throw new Error("Please enter a valid email address");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // In a real app, you would create a user in your database
  return { token: "fake-jwt-token" };
};