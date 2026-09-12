import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function ClosingStatement({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section className="bg-[#F8F9F7] pt-32 pb-16 border-t border-gray-100 flex justify-center">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-12 group cursor-pointer">
          <h2 className="text-6xl md:text-8xl lg:text-[10rem] font-bold text-[#0A1C16] leading-[0.85] tracking-tighter uppercase transition-colors">
            Know Your <br /> Business.
          </h2>
          <Link
            href={isLoggedIn ? "/app" : "/sign-up"}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#B8F25C] flex items-center justify-center text-[#0A1C16] hover:bg-[#A0E040] transition-colors shadow-lg group-hover:scale-105 duration-300 flex-shrink-0"
            aria-label={isLoggedIn ? "Go to Dashboard" : "Get Started"}
          >
            <ArrowUpRight className="w-10 h-10 md:w-14 md:h-14" />
          </Link>
        </div>
      </div>
    </section>
  );
}
