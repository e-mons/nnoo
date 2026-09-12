import Image from "next/image";
import Link from "next/link";
import { BarChart2, PackageOpen, MessageSquare, ArrowRight } from "lucide-react";

export default function ProductShowcase({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section className="bg-[#0A1C16] py-24 lg:py-32 overflow-hidden relative">
      {/* Decorative background grids */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="container relative z-10 mx-auto px-4 md:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-20 md:mb-32">
          <div className="inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-6">
            <span className="text-xs font-bold tracking-wider text-white uppercase">
              See Your Business More Clearly
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            One Business.<br />
            One Intelligent System.
          </h2>
        </div>

        <div className="flex flex-col gap-24 lg:gap-40">
          
          {/* Row 1: Know Your Numbers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 flex flex-col items-start max-w-xl">
              <div className="w-14 h-14 rounded-2xl bg-[#143628] flex items-center justify-center mb-8 border border-white/5">
                <BarChart2 className="text-[#B8F25C] w-7 h-7" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Know Your Numbers
              </h3>
              <p className="text-lg text-white/70 leading-relaxed">
                See your sales, expenses and business performance without searching through notebooks or complicated spreadsheets. Everything is organized in one clear dashboard.
              </p>
            </div>
            <div className="order-1 lg:order-2 relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#143628] border border-white/10 shadow-2xl">
              <Image
                src="/images/marketing/showcase-numbers.png"
                alt="NNOO Sales and Expense Chart"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* Row 2: Stock and Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center" id="inventory">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#143628] border border-white/10 shadow-2xl">
              <Image
                src="/images/marketing/showcase-stock.png"
                alt="NNOO Stock and Customer Management"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
            <div className="flex flex-col items-start max-w-xl lg:pl-10">
              <div className="w-14 h-14 rounded-2xl bg-[#143628] flex items-center justify-center mb-8 border border-white/5">
                <PackageOpen className="text-[#B8F25C] w-7 h-7" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Stay On Top of Stock and Customers
              </h3>
              <p className="text-lg text-white/70 leading-relaxed">
                Know what is running low, what customers bought and which payments still need attention. Stay in control of your daily operations.
              </p>
            </div>
          </div>

          {/* Row 3: AI Assistant */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 flex flex-col items-start max-w-xl">
              <div className="w-14 h-14 rounded-2xl bg-[#143628] flex items-center justify-center mb-8 border border-white/5">
                <MessageSquare className="text-[#B8F25C] w-7 h-7" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ask Your Business a Question
              </h3>
              <p className="text-lg text-white/70 leading-relaxed mb-6">
                NNOO is designed to help business owners understand their information in simple language. Just ask.
              </p>
              <ul className="space-y-4 text-white/80 font-medium">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8F25C]" /> &quot;How much did I sell today?&quot;
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8F25C]" /> &quot;Which products are running low?&quot;
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8F25C]" /> &quot;Who still owes me?&quot;
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#143628] border border-white/10 shadow-2xl">
              <Image
                src="/images/marketing/showcase-ai.png"
                alt="NNOO AI Business Assistant"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>

        </div>

        {/* Bottom CTA */}
        <div className="mt-32 pt-20 border-t border-white/10 flex flex-col items-center text-center">
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-10 max-w-2xl">
            Built for the Real Questions Business Owners Ask Every Day.
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href={isLoggedIn ? "/app" : "/sign-up"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-[#B8F25C] px-8 py-4 text-base font-semibold text-[#0A1C16] hover:bg-[#A0E040] transition-colors"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start With NNOO"} <ArrowRight size={18} />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-8 py-4 text-base font-semibold text-white hover:bg-white/5 transition-colors"
            >
              Explore Features
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
