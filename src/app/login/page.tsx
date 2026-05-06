"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau Password salah!");
      setLoading(false);
    } else {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      const role = session?.user?.role;

      router.refresh();
      
      if (role === 'ADMIN') {
        router.push("/");
      } else {
        router.push("/survey/baru");
      }
    }
  };

  // Classes for animations (only apply when mounted to avoid hydration mismatch)
  const animFadeInUp = mounted ? "animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both" : "opacity-0";
  const animFadeIn = mounted ? "animate-in fade-in duration-1000 fill-mode-both" : "opacity-0";

  return (
    <div className="flex min-h-screen w-full bg-emerald-950 text-white overflow-hidden font-sans">
      {/* ── Kiri: Form Area ── */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-between p-8 sm:p-12 md:p-16 relative z-20">
        
        {/* Header / Logo */}
        <div className={`flex items-center gap-3 ${animFadeInUp} delay-100`}>
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center p-1 overflow-hidden shadow-lg shadow-emerald-500/20">
            <img 
              src="/logo-du.png" 
              alt="Dompet Ummat" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight leading-none text-white">DOMPET UMMAT</h2>
            <p className="text-[9px] font-black tracking-[0.2em] text-emerald-500 uppercase mt-1">BIDA Platform</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[400px] mx-auto mt-16 sm:mt-24 mb-12">
          <p className={`text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-4 ${animFadeInUp} delay-200`}>
            BIDA ANALYTICS PORTAL
          </p>
          <h1 className={`text-4xl sm:text-5xl font-black mb-10 leading-[1.1] tracking-tight ${animFadeInUp} delay-300`}>
            Masuk ke <br />
            akun <span className="text-emerald-500 relative">Anda.<span className="absolute bottom-1 left-0 w-full h-2 bg-emerald-500/20 -z-10 rounded-full"></span></span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Email */}
            <div className={`space-y-1.5 ${animFadeInUp} delay-[400ms]`}>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full bg-emerald-900/40 border border-emerald-800/50 rounded-xl py-3.5 px-5 text-sm font-semibold text-white transition-all focus:outline-none focus:border-emerald-500 focus:bg-emerald-950 hover:bg-emerald-900/60 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-500/50"
                placeholder="admin@dompetummat.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Input Password */}
            <div className={`space-y-1.5 ${animFadeInUp} delay-[500ms]`}>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full bg-emerald-900/40 border border-emerald-800/50 rounded-xl py-3.5 px-5 text-sm font-semibold text-white transition-all focus:outline-none focus:border-emerald-500 focus:bg-emerald-950 hover:bg-emerald-900/60 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-500/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className={`rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 mt-2 ${animFadeInUp}`}>
                <p className="text-xs text-rose-400 font-bold text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className={`pt-6 flex flex-col sm:flex-row items-center gap-4 ${animFadeInUp} delay-[600ms]`}>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 hover:-translate-y-0.5 hover:shadow-emerald-500/40 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Memverifikasi...' : 'Login Sekarang'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={`mt-auto ${animFadeInUp} delay-[700ms]`}>
          <p className="text-[11px] text-slate-500 font-medium">
            Hak akses diatur oleh Administrator.
            <br />&copy; 2026 Dompet Ummat Kalimantan Barat.
          </p>
        </div>
      </div>

      {/* ── Kanan: Background Area ── */}
      <div className={`hidden lg:block lg:w-[55%] xl:w-[60%] relative bg-emerald-900 ${animFadeIn} delay-300`}>
        {/* Gambar background diletakkan di paling bawah (z-0) */}
        {/* Tambahkan background-color cadangan jika gambar gagal load */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 bg-emerald-950"
          style={{ backgroundImage: 'url("/_DSC6959.webp")' }}
        />

        {/* Overlay gradient di atas gambar (z-10) untuk transisi dari gambar ke konten form */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-transparent z-10" />
        
        {/* Curved shape divider yang meniru referensi UI (z-20) */}
        <svg 
          className="absolute left-0 top-0 h-full text-emerald-950 w-32 z-20" 
          preserveAspectRatio="none" 
          viewBox="0 0 100 100" 
          fill="currentColor"
        >
          <path d="M0,0 Q100,25 50,50 T100,100 L0,100 Z" />
        </svg>

        {/* Watermark Logo Besar */}
        <div className={`absolute bottom-12 right-12 z-20 opacity-20 flex items-center gap-3 ${animFadeInUp} delay-[800ms]`}>
           <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center p-2 backdrop-blur-sm">
             <img 
                src="/logo-du.png" 
                alt="Logo" 
                className="w-12 h-12 object-contain brightness-0 invert" 
             />
           </div>
        </div>
      </div>
    </div>
  );
}