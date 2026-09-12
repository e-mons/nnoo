import { BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function KnowledgeSection({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const articles = [
    {
      title: "Understanding Profit",
      description: "Why sales and profit are not the same thing.",
      href: isLoggedIn ? "/app" : "/sign-up",
    },
    {
      title: "Managing Stock",
      description: "Why knowing what is running low matters for your cash flow.",
      href: isLoggedIn ? "/app" : "/sign-up",
    },
    {
      title: "Building Business Records",
      description: "How consistent records can help a business understand its progress.",
      href: isLoggedIn ? "/app" : "/sign-up",
    },
  ];

  return (
    <section className="bg-[#F8F9F7] py-24 border-y border-gray-100" id="resources">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 lg:mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-[#0A1C16] leading-tight tracking-tight mb-4">
              Business Knowledge,<br className="hidden md:block" /> Made Easier
            </h2>
            <p className="text-lg text-gray-600">
              Clear, practical guides to help you understand your business better.
            </p>
          </div>
          <Link
            href={isLoggedIn ? "/app" : "/sign-up"}
            className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-[#143628] hover:text-[#0A1C16] bg-white border border-gray-200 px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all"
          >
            {isLoggedIn ? "Access Dashboard" : "Access All Resources"}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {articles.map((article) => (
            <Link
              key={article.title}
              href={article.href}
              className="group flex flex-col p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#E8F8D4] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#E8F8D4] flex items-center justify-center text-[#143628] mb-8 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#0A1C16] mb-3 group-hover:text-[#143628] transition-colors">
                {article.title}
              </h3>
              <p className="text-gray-500 leading-relaxed mb-8 flex-grow">
                {article.description}
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#143628]">
                Get Access <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
