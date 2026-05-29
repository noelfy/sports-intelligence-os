"use client";

import { useStore } from "@/lib/store";
import Link from "next/link";

export function Navbar() {
  const { user, logout } = useStore();

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="gradient-text text-xl font-bold tracking-tight">
              NeuroVolley AI
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            {user && (
              <Link
                href="/history"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                History
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">{user.username}</span>
                <button
                  onClick={logout}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
