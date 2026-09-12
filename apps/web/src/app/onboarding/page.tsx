import { BusinessOnboardingForm } from '@/components/forms/BusinessOnboardingForm';

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-lg bg-[#0A1C16]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Set up your business</h1>
        <p className="text-white/60">
          Create your business workspace to start managing your operations on NNOO.
        </p>
      </div>
      
      <BusinessOnboardingForm />
    </div>
  );
}
