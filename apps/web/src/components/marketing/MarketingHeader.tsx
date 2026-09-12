"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Smartphone, ArrowRight } from "lucide-react";

interface MarketingHeaderProps {
  isLoggedIn?: boolean;
}

export default function MarketingHeader({ isLoggedIn = false }: MarketingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "#features" },
    { name: "Solutions", href: "#solutions" },
    { name: "About", href: "#about" },
    { name: "Resources", href: "#resources" },
  ];

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-50 flex justify-center pt-4 md:pt-6 px-4 pointer-events-none transition-all duration-300">
        <header
          className={`pointer-events-auto flex items-center justify-between w-full max-w-5xl rounded-full px-4 lg:px-6 py-3 transition-all duration-300 ${
            scrolled
              ? "bg-[#143628]/95 backdrop-blur-xl shadow-2xl border border-white/20"
              : "bg-[#143628]/80 backdrop-blur-md shadow-lg border border-white/10"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="NNOO Home">
            <Image
              src="/logo-dark-horizontal.png"
              alt="NNOO Logo"
              width={140}
              height={36}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-white/90 hover:text-[#B8F25C] transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/app"
                className="flex items-center gap-2 rounded-full bg-[#B8F25C] px-5 py-2.5 text-sm font-bold text-[#0A1C16] hover:bg-[#A0E040] transition-all shadow-[0_0_15px_rgba(184,242,92,0.2)] hover:shadow-[0_0_20px_rgba(184,242,92,0.4)]"
              >
                DASHBOARD
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-bold text-white hover:text-[#B8F25C] transition-colors"
                >
                  SIGN IN
                </Link>
                <Link
                  href="/sign-up"
                  className="flex items-center gap-2 rounded-full bg-[#B8F25C] px-5 py-2.5 text-sm font-bold text-[#0A1C16] hover:bg-[#A0E040] transition-all shadow-[0_0_15px_rgba(184,242,92,0.2)] hover:shadow-[0_0_20px_rgba(184,242,92,0.4)]"
                >
                  <Smartphone size={16} className="fill-[#0A1C16]" />
                  GET STARTED
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white hover:text-[#B8F25C] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0A1C16]/95 backdrop-blur-lg pt-28 px-6 lg:hidden">
          <nav className="flex flex-col space-y-6 text-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-2xl font-semibold text-white hover:text-[#B8F25C]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-8 flex flex-col items-center gap-4">
              {isLoggedIn ? (
                <Link
                  href="/app"
                  className="flex items-center gap-2 rounded-full bg-[#B8F25C] px-8 py-4 text-lg font-bold text-[#0A1C16] hover:bg-[#A0E040]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  GO TO DASHBOARD
                  <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-lg font-bold text-white hover:text-[#B8F25C]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    SIGN IN
                  </Link>
                  <Link
                    href="/sign-up"
                    className="flex items-center gap-2 rounded-full bg-[#B8F25C] px-8 py-4 text-lg font-bold text-[#0A1C16] hover:bg-[#A0E040]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Smartphone size={20} className="fill-[#0A1C16]" />
                    GET STARTED
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
