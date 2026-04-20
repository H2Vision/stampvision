"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function AlertBell() {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    try {
      const res  = await fetch("/api/alertas?count=true", { cache: "no-store" });
      const json = await res.json();
      setCount(json.count ?? 0);
    } catch {
      // silently ignore network errors
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30_000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/alertas"
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-lg",
        "text-gray-500 hover:text-gray-800 hover:bg-surface-input",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel/40"
      )}
      aria-label={`${count} alertas no leídas`}
    >
      <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
      {count > 0 && (
        <span className={cn(
          "absolute -top-0.5 -right-0.5",
          "flex items-center justify-center",
          "min-w-[18px] h-[18px] px-1",
          "bg-red-500 text-white text-[10px] font-bold leading-none",
          "rounded-full border-2 border-white shadow-sm",
          "animate-pulse"
        )}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
