import { Activity, ShieldCheck, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";

export default function BusinessHealthSection() {
  return (
    <section className="bg-white py-24 lg:py-32 relative overflow-hidden" id="health">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E8F8D4]/40 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#E8F8D4]/40 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center justify-center rounded-full bg-white border border-gray-200 px-4 py-1.5 mb-6 shadow-sm">
            <span className="text-xs font-bold tracking-wider text-[#143628] uppercase">
              From Activity to Business Trust
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0A1C16] leading-[1.1] tracking-tight mb-6">
            Build a Business Record <br className="hidden md:block" /> You Can Stand Behind
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            NNOO turns your everyday sales and expenses into a clear, verifiable picture of your business performance, opening doors to future growth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* --------------------------------------------------------- */}
          {/* CARD 1: BUSINESS HEALTH (Intensive Graphic UI)            */}
          {/* --------------------------------------------------------- */}
          <div className="bg-[#0A1C16] rounded-[2.5rem] p-8 md:p-12 border border-gray-800 relative overflow-hidden group shadow-2xl flex flex-col justify-between h-full">
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#B8F25C]/10 rounded-full blur-[80px] z-0 opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
            
            {/* Simulated UI Graphic Area */}
            <div className="relative z-10 mb-12 flex justify-center">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Outer dashed ring */}
                <svg className="absolute inset-0 w-full h-full animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                </svg>
                {/* Inner progress ring */}
                <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#B8F25C" strokeWidth="8" strokeDasharray="276" strokeDashoffset="40" className="drop-shadow-[0_0_10px_rgba(184,242,92,0.5)]" />
                </svg>
                
                {/* Center Content */}
                <div className="text-center flex flex-col items-center">
                  <Activity className="w-8 h-8 text-[#B8F25C] mb-2" />
                  <span className="text-5xl font-bold text-white tracking-tighter">A+</span>
                  <span className="text-xs font-semibold text-[#B8F25C] uppercase tracking-widest mt-1">Excellent</span>
                </div>

                {/* Floating Metric 1 */}
                <div className="absolute -left-4 top-1/4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 flex items-center gap-2 animate-[bounce_4s_infinite]">
                  <TrendingUp className="w-4 h-4 text-[#B8F25C]" />
                  <div>
                    <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Sales</p>
                    <p className="text-sm font-bold text-white">Consistent</p>
                  </div>
                </div>

                {/* Floating Metric 2 */}
                <div className="absolute -right-8 bottom-1/4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 flex items-center gap-2 animate-[bounce_5s_infinite_0.5s]">
                  <BarChart3 className="w-4 h-4 text-[#B8F25C]" />
                  <div>
                    <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Expenses</p>
                    <p className="text-sm font-bold text-white">Controlled</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 mt-auto">
              <h3 className="text-3xl font-bold text-white mb-4">Business Health</h3>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                A live, intelligent score based on your sales consistency, expense control, and stock management. Know exactly where your business stands daily.
              </p>
              
              <div className="flex flex-wrap gap-2">
                {['Stock Position', 'Customer Balances', 'Record Completeness'].map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>


          {/* --------------------------------------------------------- */}
          {/* CARD 2: CREDIT PASSPORT (Intensive Graphic UI)            */}
          {/* --------------------------------------------------------- */}
          <div className="bg-[#143628] rounded-[2.5rem] p-8 md:p-12 border border-white/10 relative overflow-hidden group shadow-2xl flex flex-col justify-between h-full" id="passport">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            {/* Simulated UI Graphic Area */}
            <div className="relative z-10 mb-12 flex justify-center mt-4">
              
              <div className="relative w-full max-w-sm bg-[#0A1C16]/80 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-500">
                
                {/* Header of Passport */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#B8F25C]/20 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-[#B8F25C]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg leading-none">Credit Passport</h4>
                      <span className="text-[#B8F25C] text-xs font-bold uppercase tracking-wider">Verified Record</span>
                    </div>
                  </div>
                  {/* Verified Stamp */}
                  <div className="w-12 h-12 rounded-full border-2 border-[#B8F25C]/30 flex items-center justify-center rotate-12">
                    <CheckCircle2 className="w-6 h-6 text-[#B8F25C]" />
                  </div>
                </div>

                {/* Data Rows */}
                <div className="space-y-4">
                  {[
                    { label: 'Revenue Pattern', status: 'Verified', width: '100%' },
                    { label: 'Cash Movement', status: 'Verified', width: '85%' },
                    { label: 'Stock Movement', status: 'Verified', width: '90%' },
                    { label: 'Payment Behaviour', status: 'Excellent', width: '95%' },
                  ].map((row, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-end">
                        <span className="text-white/60 text-xs font-medium uppercase tracking-wider">{row.label}</span>
                        <span className="text-white text-xs font-bold">{row.status}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#143628] to-[#B8F25C]" style={{ width: row.width }} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 mt-auto">
              <h3 className="text-3xl font-bold text-white mb-4">Credit Passport</h3>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                Your consistent activity builds a reliable, exportable history. Designed to create a truthful, clear business-readiness picture to help you build trust.
              </p>

              <div className="flex items-center gap-2 text-[#B8F25C] font-bold text-sm uppercase tracking-wide group-hover:gap-4 transition-all">
                Learn how it works 
                <span className="text-lg leading-none">&rarr;</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
