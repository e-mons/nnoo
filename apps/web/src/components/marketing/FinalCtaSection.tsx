import Link from "next/link";
import { ArrowRight, BarChart2, Briefcase, FileText } from "lucide-react";

export default function FinalCtaSection({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section className="bg-white py-12 pb-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="bg-[#0A1C16] rounded-[2.5rem] p-10 md:p-16 lg:p-24 overflow-hidden relative border border-white/10 shadow-2xl">
          
          {/* Decorative background grids */}
          <div className="absolute inset-0 z-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#143628] rounded-full blur-[100px] opacity-50 -mr-40 -mt-40 z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 items-center">
            
            {/* Left Content */}
            <div className="flex flex-col items-start max-w-xl">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
                Know Your Business Better.<br />
                <span className="text-[#B8F25C]">Start With NNOO.</span>
              </h2>
              <p className="text-lg text-white/70 leading-relaxed mb-10">
                Bring your sales, expenses, stock, customers and business information into one clearer system.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  href={isLoggedIn ? "/app" : "/sign-up"}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-[#B8F25C] px-8 py-4 text-base font-semibold text-[#0A1C16] hover:bg-[#A0E040] transition-colors"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Get Started"} <ArrowRight size={18} />
                </Link>
                <Link
                  href="#how-it-works"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-colors border border-white/10"
                >
                  See How It Works
                </Link>
              </div>
            </div>

            {/* Right Highlight Blocks */}
            <div className="flex flex-col gap-4 lg:pl-12">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#143628] flex items-center justify-center text-[#B8F25C] flex-shrink-0">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Track Daily Business</h4>
                  <p className="text-white/60 text-sm">Record activity as it happens.</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#143628] flex items-center justify-center text-[#B8F25C] flex-shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Understand Performance</h4>
                  <p className="text-white/60 text-sm">Clear insights, no jargon.</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#143628] flex items-center justify-center text-[#B8F25C] flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Build Better Records</h4>
                  <p className="text-white/60 text-sm">Prepare for future opportunities.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
