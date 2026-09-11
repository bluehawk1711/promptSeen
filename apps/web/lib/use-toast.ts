/**
 * Toast hook for the admin panel.
 * Wraps the base-ui toast manager for easy use.
 */

import { toast } from "@/components/ui/toast";

export function useToast() {
  return {
    success: (title: string, description?: string) => {
      toast.add({
        title,
        description,
        type: "success",
      });
    },
    error: (title: string, description?: string) => {
      toast.add({
        title,
        description,
        type: "error",
      });
    },
    info: (title: string, description?: string) => {
      toast.add({
        title,
        description,
        type: "info",
      });
    },
    warning: (title: string, description?: string) => {
      toast.add({
        title,
        description,
        type: "warning",
      });
    },
    loading: (title: string, description?: string) => {
      return toast.add({
        title,
        description,
        type: "loading",
      });
    },
  };
}
