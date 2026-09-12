import { Calculator, BarChart3, Package, Users, Activity, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FeatureGrid({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const features = [
    {
      id: "01",
      title: "AI Bookkeeper",
      description: "Turn everyday business activity into clearer organised records.",
      icon: <Calculator className="w-5 h-5" />,
      isHighlight: false,
    },
    {
      id: "02",
      title: "Business Insights",
      description: "Understand sales, expenses and performance without complicated reports.",
      icon: <BarChart3 className="w-5 h-5" />,
      isHighlight: true, // The dark focal point card
    },
    {
      id: "03",
      title: "Smart Inventory",
      description: "Know what is available, what is moving and what needs attention.",
      icon: <Package className="w-5 h-5" />,
      isHighlight: false,
    },
    {
      id: "04",
      title: "Customers & Invoices",
      description: "Keep customer records, invoices and outstanding balances organised.",
      icon: <Users className="w-5 h-5" />,
      isHighlight: false,
    },
    {
      id: "05",
      title: "Business Health",
      description: "See the areas of your business that are strong or need attention.",
      icon: <Activity className="w-5 h-5" />,
      isHighlight: false,
    },
    {
      id: "06",
      title: "Credit Passport",
      description: "Build a clearer history of how your business performs over time.",
      icon: <ShieldCheck className="w-5 h-5" />,
      isHighlight: false,
    },
  ];

  return (
    <section id="features" className="bg-white py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center rounded-full bg-[#E8F8D4] px-4 py-1.5 mb-6">
            <span className="text-xs font-bold tracking-wider text-[#143628] uppercase">
              Explore Our Powerful Features
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#0A1C16] leading-tight tracking-tight">
            Everything You Need to <br className="hidden md:block" /> Understand Your Business
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                feature.isHighlight
                  ? "bg-[#0A1C16] border-[#143628] text-white shadow-lg"
                  : "bg-white border-gray-100 text-[#0A1C16] shadow-sm hover:border-gray-200"
              }`}
            >
              {/* Icon & ID */}
              <div className="flex justify-between items-start mb-12">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    feature.isHighlight
                      ? "bg-[#143628] text-[#B8F25C]"
                      : "bg-[#E8F8D4] text-[#143628]"
                  }`}
                >
                  {feature.icon}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    feature.isHighlight ? "text-white/40" : "text-gray-300"
                  }`}
                >
                  {feature.id}
                </span>
              </div>

              {/* Content */}
              <div className="mt-auto">
                <h3
                  className={`text-xl font-bold mb-3 ${
                    feature.isHighlight ? "text-white" : "text-[#0A1C16]"
                  }`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed mb-6 ${
                    feature.isHighlight ? "text-white/70" : "text-gray-500"
                  }`}
                >
                  {feature.description}
                </p>
                <Link
                  href={isLoggedIn ? "/app" : "/sign-up"}
                  className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
                    feature.isHighlight
                      ? "text-[#B8F25C] hover:text-[#A0E040]"
                      : "text-[#143628] hover:text-[#0A1C16]"
                  }`}
                >
                  {isLoggedIn ? "Go to Dashboard" : "Get Started"} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
