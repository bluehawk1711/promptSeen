import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export shared utilities for the admin panel
export {
  loadFirebaseConfig,
  initFirebase,
  messageFor,
  Colors,
  darkColors,
  lightColors,
  withOpacity,
  HEIGHT,
  FONT_SIZE,
  BORDER_RADIUS,
  CORNERS,
  SPACING,
} from "@repo/shared"