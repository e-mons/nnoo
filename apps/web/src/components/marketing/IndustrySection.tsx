import { ShoppingBag, Pill, Utensils, BookOpen, Tractor, Building, Truck, Factory } from "lucide-react";

export default function IndustrySection() {
  const industries = [
    {
      id: "markets",
      name: "Market Traders",
      description: "Sales, stock, expenses and daily visibility.",
      icon: <ShoppingBag className="w-6 h-6" />,
    },
    {
      id: "pharmacies",
      name: "Pharmacies",
      description: "Inventory, batches, expiry awareness and business records.",
      icon: <Pill className="w-6 h-6" />,
    },
    {
      id: "restaurants",
      name: "Restaurants",
      description: "Sales, food cost and inventory visibility.",
      icon: <Utensils className="w-6 h-6" />,
    },
    {
      id: "schools",
      name: "Schools",
      description: "Fees, records and operational tracking.",
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      id: "farms",
      name: "Farms",
      description: "Inputs, production records and business activity.",
      icon: <Tractor className="w-6 h-6" />,
    },
    {
      id: "hotels",
      name: "Hotels",
      description: "Bookings, expenses and operational visibility.",
      icon: <Building className="w-6 h-6" />,
    },
    {
      id: "transport",
      name: "Transport",
      description: "Vehicles, fuel, maintenance and business costs.",
      icon: <Truck className="w-6 h-6" />,
    },
    {
      id: "manufacturing",
      name: "Manufacturing",
      description: "Raw materials, production and stock movement.",
      icon: <Factory className="w-6 h-6" />,
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24" id="industries">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry) => (
            <div
              key={industry.name}
              id={industry.id}
              className="group p-6 rounded-2xl bg-[#F8F9F7] border border-gray-100 hover:border-[#E8F8D4] hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#143628] mb-6 shadow-sm group-hover:scale-110 transition-transform">
                {industry.icon}
              </div>
              <h4 className="text-lg font-bold text-[#0A1C16] mb-2">{industry.name}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                {industry.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
