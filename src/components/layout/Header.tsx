// components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="w-full px-6 py-6 sm:px-6 lg:px-60 sticky top-0 z-50 border-gray-100">
      <nav className="flex items-center justify-between max-w-10xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors">
            <Image src="/branding/logo.png" alt="Logo" width={60} height={60} />
          </div>
          <span className="text-2xl font-bold text-primary group-hover:text-primary-700 transition-colors">
            Wryte.
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors geist text-primary font-semibold ${
                isActive(link.href)
                  ? "text-primary-600 font-semibold"
                  : "hover:text-primary-600"
              }`}
              scroll={false} // Disable default scroll behavior for smooth scrolling
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="px-4 py-2 geist border-2 text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-all duration-200 font-medium"
          >
            Log In
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-100">
          <div className="flex flex-col space-y-4 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors font-medium px-4 py-2 rounded-lg ${
                  isActive(link.href)
                    ? "text-primary-600 bg-primary-50 font-semibold"
                    : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                scroll={false}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="mx-4 px-4 py-2 border border-purple-300 text-primary-600 rounded-lg hover:bg-primary-50 hover:border-purple-400 transition-all duration-200 font-medium text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Log In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
