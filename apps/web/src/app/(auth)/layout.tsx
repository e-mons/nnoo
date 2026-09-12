import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Authentication | NNOO",
  description: "Sign in or create an account for NNOO, Africa's AI Business Operating System.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A1C16] flex flex-col items-center justify-center relative overflow-hidden selection:bg-[#B8F25C] selection:text-[#0A1C16]">
      
      {/* Background Decorative Gradients & Waves (Consistent with Marketing Theme) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-b from-[#143628] to-transparent blur-[120px] opacity-70" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[#B8F25C]/10 blur-[120px] opacity-60" />
      </div>

      <div className="w-full max-w-md px-4 sm:px-6 relative z-10 flex flex-col">
        
        {/* Top Navigation Back to Home */}
        <div className="mb-8 self-start">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Auth Content Container */}
        <div className="bg-[#143628]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          
          {/* Subtle Inner Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#B8F25C]/50 to-transparent" />
          
          {/* Logo Mark */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center justify-center">
              <Image
                src="/logo-dark-icon.png"
                alt="NNOO Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {children}

        </div>
      </div>
    </div>
  );
}
