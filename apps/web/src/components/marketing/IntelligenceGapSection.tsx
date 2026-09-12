import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function IntelligenceGapSection() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Visual Collage */}
          <div className="relative order-2 lg:order-1 w-full aspect-square md:aspect-[4/3] lg:aspect-square">
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <Image
                src="/images/marketing/intelligence-gap.png"
                alt="African businesses operating daily"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
            {/* Decorative element behind image */}
            <div className="absolute -inset-4 md:-inset-6 -z-10 rounded-3xl bg-[#F8F9F7] border border-gray-100 transform rotate-2"></div>
          </div>

          {/* Right Content */}
          <div className="order-1 lg:order-2 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F9F7] px-4 py-1.5 mb-6">
              <span className="text-xs font-bold tracking-wider text-[#143628] uppercase">
                SMARTER BUSINESS, MADE SIMPLE
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-[#0A1C16] leading-[1.15] tracking-tight mb-6">
              Bridging the Gap Between <br className="hidden md:block" />
              Activity and Understanding
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-10">
              African businesses already make sales, receive transfers, buy stock and serve customers every day. NNOO helps turn those activities into organised information business owners can actually understand.
            </p>

            {/* Circular Metric Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 w-full">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#E8F8D4] flex items-center justify-center">
                  <CheckCircle2 className="text-[#143628] w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1C16] text-lg mb-1">One View</h3>
                  <p className="text-sm text-gray-500">Sales, expenses, stock and customers.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#E8F8D4] flex items-center justify-center">
                  <CheckCircle2 className="text-[#143628] w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1C16] text-lg mb-1">Real Clarity</h3>
                  <p className="text-sm text-gray-500">Business information in simple language.</p>
                </div>
              </div>
            </div>

            <Link
              href="#features"
              className="inline-flex items-center gap-2 text-[#143628] font-semibold hover:text-[#B8F25C] transition-colors group"
            >
              Explore NNOO 
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
