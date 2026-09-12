import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, QrCode, MessageSquare, Play } from "lucide-react";

export default function HeroSection({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-[#0A1C16] pt-32 md:pt-48 pb-20 md:pb-32 min-h-screen flex flex-col justify-center">
      {/* Background Decorative Pattern & Waves */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Soft radial gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-[#143628] to-transparent blur-3xl opacity-60" />
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-[#B8F25C]/5 to-transparent blur-3xl opacity-60" />
        
        {/* SVG Waves mimicking the reference */}
        <svg className="absolute w-full h-full opacity-20 text-white" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <path d="M-100,200 C300,50 600,350 1000,100 C1300,-50 1500,200 1600,300" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M-100,250 C300,100 600,400 1000,150 C1300,0 1500,250 1600,350" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
          <path d="M-50,850 C200,600 500,800 800,600 C1100,400 1300,700 1500,550" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M-50,900 C200,650 500,850 800,650 C1100,450 1300,750 1500,600" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <div className="flex flex-col items-start lg:col-span-5 pt-10">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center rounded-full border border-white/20 bg-[#143628]/50 backdrop-blur-sm px-4 py-1.5 mb-6 shadow-sm">
              <span className="text-sm font-medium tracking-wide text-white">
                The Best In Business Intelligence!
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-[4rem] font-bold text-white leading-[1.1] tracking-tight mb-8">
              Stay Connected <br />
              With Better <br />
              <span className="text-[#B8F25C]">Business Records</span>
            </h1>

            {/* Action Bar (Matching the sleek dual-action input design) */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md lg:max-w-none mt-4">
              
              {/* Dark Pill Input/Button Combo */}
              <div className="flex items-center justify-between w-full sm:w-auto bg-[#143628]/80 backdrop-blur-md border border-white/10 rounded-full pl-5 pr-1.5 py-1.5 shadow-lg flex-grow max-w-[320px]">
                <div className="flex items-center gap-2 text-white/50">
                  <Mail className="w-5 h-5" />
                  <input 
                    type="email" 
                    placeholder="ENTER EMAIL" 
                    className="bg-transparent border-none outline-none text-sm text-white placeholder-white/50 w-full uppercase font-medium tracking-wide"
                  />
                </div>
                <Link href={isLoggedIn ? "/app" : "/sign-up"} className="flex items-center gap-2 bg-white text-[#0A1C16] px-5 py-2.5 rounded-full font-bold text-sm uppercase hover:bg-gray-100 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                  {isLoggedIn ? "DASHBOARD" : "JOIN"}
                </Link>
              </div>

              {/* Lime Green CTA Button */}
              <Link href={isLoggedIn ? "/app" : "/sign-up"} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-[#B8F25C] px-6 py-3.5 text-sm font-bold text-[#0A1C16] hover:bg-[#A0E040] transition-all shadow-[0_0_15px_rgba(184,242,92,0.2)] hover:shadow-[0_0_25px_rgba(184,242,92,0.4)] uppercase tracking-wide flex-shrink-0">
                <Play className="w-4 h-4 fill-[#0A1C16]" />
                {isLoggedIn ? "GO TO APP" : "START NOW"}
              </Link>
            </div>
          </div>

          {/* Right Visual Composition */}
          <div className="relative w-full lg:col-span-7 flex justify-center lg:justify-end mt-12 lg:mt-0">
            {/* Main Glowing Backdrop */}
            <div className="absolute inset-0 bg-[#B8F25C]/10 blur-[80px] rounded-full transform scale-75 z-0" />
            
            <div className="relative z-10 w-full max-w-[650px] aspect-[16/10] bg-[#143628] rounded-3xl p-3 md:p-4 border border-white/20 shadow-2xl shadow-black/50">
              {/* Inner Dashboard Frame */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black border border-white/5">
                <Image
                  src="/images/marketing/hero-dashboard.png"
                  alt="NNOO Business Dashboard"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                  className="object-cover object-center opacity-90 hover:opacity-100 transition-opacity duration-500"
                />
              </div>

              {/* Floating Element 1: Left Notification Bubble (Mimicking Video Caller) */}
              <div className="absolute -left-6 md:-left-12 top-1/4 bg-white rounded-2xl p-3 shadow-xl flex items-center gap-3 border border-gray-100 animate-[bounce_4s_infinite]">
                <div className="w-10 h-10 rounded-full bg-[#F8F9F7] flex items-center justify-center overflow-hidden border border-gray-200">
                  <Image src="/images/marketing/built-for-africa.png" alt="User" width={40} height={40} className="object-cover" />
                </div>
                <div className="pr-2">
                  <p className="text-xs font-bold text-[#0A1C16]">Hello Boss! <span className="text-gray-400 font-normal ml-1">12:45</span></p>
                </div>
              </div>

              {/* Floating Element 2: Right Small Chat Bubble */}
              <div className="absolute -right-4 md:-right-8 top-1/3 bg-white rounded-full px-4 py-2 shadow-xl flex items-center gap-2 border border-gray-100 animate-[bounce_5s_infinite_0.5s]">
                <p className="text-xs font-bold text-[#0A1C16]">Sales updated! <span className="text-gray-400 font-normal ml-1">12:45</span></p>
                <div className="w-4 h-4 text-green-500"><MessageSquare size={16} /></div>
              </div>

              {/* Floating Element 3: Bottom Left Scan Box (Mimicking QR Box) */}
              <div className="absolute -bottom-8 md:-bottom-12 left-8 md:left-16 bg-white rounded-2xl p-3 pb-0 shadow-2xl border border-gray-100 w-32 md:w-36 flex flex-col items-center">
                <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center border border-gray-100">
                  <QrCode className="w-16 h-16 text-[#0A1C16]" strokeWidth={1.5} />
                </div>
                <button className="w-full bg-[#B8F25C] text-[#0A1C16] text-xs font-bold py-2 rounded-xl mb-3 hover:bg-[#A0E040] transition-colors shadow-sm">
                  Scan Receipt
                </button>
              </div>

              {/* Decorative Window Controls (Top Right of inner frame) */}
              <div className="absolute top-6 right-6 flex gap-1.5 z-20">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
