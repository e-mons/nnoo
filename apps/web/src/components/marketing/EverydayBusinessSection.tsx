import Image from "next/image";

export default function EverydayBusinessSection() {
  return (
    <section className="bg-[#F8F9F7] py-24 lg:py-32 border-b border-gray-200" id="solutions">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center rounded-full bg-white border border-gray-200 px-4 py-1.5 mb-6 shadow-sm">
            <span className="text-xs font-bold tracking-wider text-[#143628] uppercase">
              Built for Everyday African Business
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#0A1C16] leading-tight tracking-tight">
            Made for the Businesses <br className="hidden md:block" /> That Keep Africa Moving
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left large visual panel */}
          <div className="lg:col-span-7 relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-gray-100">
            <Image
              src="/images/marketing/everyday-business.png"
              alt="Various African business scenarios including transport, farming, and retail"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center"
            />
          </div>

          {/* Right card */}
          <div className="lg:col-span-5 bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8F8D4] rounded-full blur-3xl -mr-10 -mt-10 opacity-60" />
            
            <h3 className="text-2xl font-bold text-[#0A1C16] mb-6 relative z-10">
              Rooted in Reality
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed relative z-10">
              &quot;From the shop counter to the market stall, NNOO is being designed around the real work business owners do every day.&quot;
            </p>

            <div className="mt-10 flex flex-wrap gap-3 relative z-10">
              {['Market Traders', 'Pharmacies', 'Restaurants', 'Schools', 'Farms', 'Hotels', 'Transport', 'Manufacturing'].map((category) => (
                <span key={category} className="px-4 py-2 bg-[#F8F9F7] text-gray-700 text-sm font-medium rounded-full border border-gray-100">
                  {category}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
