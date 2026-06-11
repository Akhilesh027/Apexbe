import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupees (INR)
 * @param amount - The amount to format (number, string, or undefined)
 * @param maximumFractionDigits - Number of decimal places (default: 0)
 * @returns Formatted currency string (e.g., "₹1,234")
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  maximumFractionDigits: number = 0
): string {
  // Convert to number, defaulting to 0 if invalid
  let numericAmount = typeof amount === "number" ? amount : parseFloat(String(amount ?? "0"));
  if (isNaN(numericAmount)) numericAmount = 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(numericAmount);
}