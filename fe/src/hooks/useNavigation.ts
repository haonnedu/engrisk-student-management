"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function useNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const navigate = (href: string) => {
    setIsNavigating(true);
    router.push(href);

    // Reset loading state after a short delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  };

  return {
    isNavigating,
    navigate,
    setIsNavigating,
  };
}
