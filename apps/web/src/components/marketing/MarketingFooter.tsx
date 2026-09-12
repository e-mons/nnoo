import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function MarketingFooter({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2 mb-6" aria-label="NNOO Home">
              <span className="text-2xl font-bold tracking-tight text-[#0A1C16]">
                NNOO
                <span className="text-[#B8F25C]">.</span>
              </span>
            </Link>
            <p className="text-sm font-medium text-gray-500 mb-2">Africa&apos;s AI Business Operating System.</p>
            <p className="text-lg font-semibold text-[#143628] leading-tight mb-8">
              Know Your Business.<br />
              Grow Your Business.<br />
              Build Your Future.
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-semibold text-[#0A1C16] mb-6 tracking-wide text-sm uppercase">Product</h3>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Features</Link></li>
              <li><Link href="#insights" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Business Insights</Link></li>
              <li><Link href="#inventory" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Inventory</Link></li>
              <li><Link href="#health" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Business Health</Link></li>
              <li><Link href="#passport" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Credit Passport</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#0A1C16] mb-6 tracking-wide text-sm uppercase">Solutions</h3>
            <ul className="space-y-4">
              <li><Link href="#markets" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Market Traders</Link></li>
              <li><Link href="#pharmacies" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Pharmacies</Link></li>
              <li><Link href="#restaurants" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Restaurants</Link></li>
              <li><Link href="#schools" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Schools</Link></li>
              <li><Link href="#farms" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Farms</Link></li>
              <li><Link href="#transport" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Transport</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#0A1C16] mb-6 tracking-wide text-sm uppercase">Company</h3>
            <ul className="space-y-4">
              <li><Link href="#about" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">About NNOO</Link></li>
              <li><Link href="#contact" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Contact</Link></li>
              <li><Link href="#how-it-works" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">How It Works</Link></li>
              <li className="pt-4"><Link href="#faq" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">FAQ</Link></li>
              <li><Link href="/privacy" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-gray-500 hover:text-[#143628] text-sm transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-100 pt-8 mt-8">
          <p className="text-xs text-gray-400 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} NNOO. All rights reserved.
          </p>
          <div className="flex gap-4">
            {isLoggedIn ? (
              <Link href="/app" className="text-xs font-semibold text-[#143628] hover:text-[#0A1C16] flex items-center gap-1">
                Go to Dashboard <ArrowUpRight size={12} />
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-xs font-semibold text-[#143628] hover:text-[#0A1C16]">Sign In</Link>
                <Link href="/sign-up" className="text-xs font-semibold text-[#143628] hover:text-[#0A1C16] flex items-center gap-1">
                  Get Started <ArrowUpRight size={12} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
