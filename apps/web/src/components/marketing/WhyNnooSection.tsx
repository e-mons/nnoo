import { Wallet, Calculator, Database, Smartphone } from "lucide-react";

export default function WhyNnooSection() {
  const blocks = [
    {
      title: "Not Just Payments",
      description: "Money moving into an account does not automatically explain how the business is performing.",
      icon: <Wallet className="w-6 h-6" />,
    },
    {
      title: "Not Complicated Accounting",
      description: "NNOO is designed to make business information easier to understand.",
      icon: <Calculator className="w-6 h-6" />,
    },
    {
      title: "Intelligence Built on Real Records",
      description: "Useful guidance starts with the actual activity of the business.",
      icon: <Database className="w-6 h-6" />,
    },
    {
      title: "One Connected Business System",
      description: "Web, mobile and future supported channels work from one source of business information.",
      icon: <Smartphone className="w-6 h-6" />,
    },
  ];

  return (
    <section className="bg-[#0A1C16] py-24 text-white">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-6">
            More Than Payments.<br />
            <span className="text-[#B8F25C]">More Than Accounting.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {blocks.map((block) => (
            <div key={block.title} className="flex flex-col items-start bg-[#143628] p-8 rounded-3xl border border-white/10 hover:border-[#B8F25C]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#B8F25C] mb-6">
                {block.icon}
              </div>
              <h4 className="text-xl font-bold mb-3">{block.title}</h4>
              <p className="text-white/70 leading-relaxed text-sm">
                {block.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
