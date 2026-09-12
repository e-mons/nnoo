import { ArrowRight, Download, Filter, Lightbulb, Shield, Briefcase, TrendingUp } from "lucide-react";

export default function IntelligenceJourney() {
  const journeySteps = [
    { name: "Capture", icon: <Download className="w-5 h-5" /> },
    { name: "Organize", icon: <Filter className="w-5 h-5" /> },
    { name: "Understand", icon: <Lightbulb className="w-5 h-5" /> },
    { name: "Build Trust", icon: <Shield className="w-5 h-5" /> },
    { name: "Opportunities", icon: <Briefcase className="w-5 h-5" /> },
    { name: "Grow", icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <section className="bg-[#0A1C16] py-24 text-white overflow-hidden" id="insights">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-4">
            The Business Intelligence Journey
          </h2>
          <p className="text-white/70 text-lg">
            How consistent activity turns into lasting business value.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-[5%] right-[5%] h-px bg-white/20 -translate-y-1/2" />
          
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-0 relative z-10">
            {journeySteps.map((step, index) => (
              <div key={step.name} className="flex flex-col items-center flex-1 w-full lg:w-auto group">
                
                {/* Mobile connection line (except last item) */}
                {index !== journeySteps.length - 1 && (
                  <div className="lg:hidden w-px h-8 bg-white/20 my-2" />
                )}

                <div className="w-16 h-16 rounded-2xl bg-[#143628] border border-white/10 flex items-center justify-center text-[#B8F25C] mb-4 shadow-lg group-hover:-translate-y-1 transition-transform">
                  {step.icon}
                </div>
                
                <h4 className="font-bold text-sm text-center uppercase tracking-wider text-white/90">
                  {step.name}
                </h4>

                {/* Arrow pointing right (Desktop only, except last item) */}
                {index !== journeySteps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 right-0 -mr-3 text-white/30" style={{ left: `calc(${(index + 1) * (100 / journeySteps.length)}% - 12px)` }}>
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
