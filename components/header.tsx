"use client";

import Link from "next/link";
import { Utensils } from "lucide-react";

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto px-6 py-4 flex items-center justify-between max-w-6xl">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-md flex items-center justify-center">
            <Utensils className="h-5 w-5 text-white dark:text-black" />
          </div>
          <span className="text-xl font-semibold">FreeTable</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Home
          </Link>
          <Link
            href="/bookings"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            All Data
          </Link>
          <Link
            href="/api-docs"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            API Docs
          </Link>
        </nav>
      </div>
    </header>
  );
}

