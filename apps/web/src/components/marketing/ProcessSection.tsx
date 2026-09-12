import { Store, FileText, PieChart, TrendingUp } from "lucide-react";

export default function ProcessSection() {
  const steps = [
    {
      id: "01",
      title: "Create Your Business",
      icon: <Store className="w-6 h-6" />,
      active: false,
    },
    {
      id: "02",
      title: "Record Daily Activity",
      icon: <FileText className="w-6 h-6" />,
      active: false,
    },
    {
      id: "03",
      title: "Understand Your Numbers",
      icon: <PieChart className="w-6 h-6" />,
      active: true, // Active step styling
    },
    {
      id: "04",
      title: "Grow With Confidence",
      icon: <TrendingUp className="w-6 h-6" />,
      active: false,
    },
  ];

  return (
    <section className="bg-[#F8F9F7] py-20 border-y border-gray-100" id="how-it-works">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative">
          
          {/* Desktop Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-200 -translate-y-1/2 z-0" />

          {/* Steps */}
          {steps.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-row md:flex-col items-center gap-6 md:gap-4 w-full md:w-1/4 mb-10 md:mb-0 last:mb-0">
              
              {/* Icon Circle */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  step.active
                    ? "bg-[#0A1C16] text-[#B8F25C] ring-4 ring-[#E8F8D4]"
                    : "bg-white text-gray-400 border border-gray-200"
                }`}
              >
                {step.icon}
              </div>

              {/* Text */}
              <div className="flex flex-col md:items-center text-left md:text-center">
                <span
                  className={`text-xs font-bold tracking-widest uppercase mb-1 ${
                    step.active ? "text-[#143628]" : "text-gray-400"
                  }`}
                >
                  Step {step.id}
                </span>
                <h3
                  className={`text-base font-semibold ${
                    step.active ? "text-[#0A1C16]" : "text-gray-600"
                  }`}
                >
                  {step.title}
                </h3>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
