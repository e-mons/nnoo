import Image from "next/image";
import { Check } from "lucide-react";

export default function BuiltForAfricaSection() {
  const highlights = [
    "Simple workflows",
    "Mobile-first thinking",
    "Low-connectivity awareness",
    "WhatsApp-first direction",
    "Voice-first direction",
    "Local business realities",
    "Future support for local languages",
    "No need to become an accountant first",
  ];

  return (
    <section className="bg-white py-24 lg:py-32" id="about">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="/images/marketing/built-for-africa.png"
              alt="African entrepreneur using a smartphone"
              fill
              className="object-cover object-center"
            />
          </div>

          <div className="flex flex-col items-start lg:pl-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F9F7] border border-gray-100 px-4 py-1.5 mb-6">
              <span className="text-xs font-bold tracking-wider text-[#143628] uppercase">
                Designed For You
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-[#0A1C16] leading-tight tracking-tight mb-8">
              Built Around the Way <br className="hidden md:block" /> African Businesses Work
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-10">
              NNOO Wherever Business Happens. We are designing NNOO specifically for the reality of African commerce on web and mobile.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 w-full">
              {highlights.map((highlight) => (
                <div key={highlight} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#E8F8D4] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#143628] stroke-[3]" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm leading-tight">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
