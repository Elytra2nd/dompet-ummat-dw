"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      // Ambil data session untuk mengetahui role user
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      const role = session?.user?.role;

      router.refresh();
      
      if (role === 'ADMIN') {
        router.push("/"); // Admin → Dashboard
      } else {
        router.push("/survey/baru"); // Relawan → Input Survey
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl border border-slate-100">
        
        {/* LOGO */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <HeartHandshake className="h-7 w-7" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              DOMPET <span className="text-emerald-600">UMMAT</span>
            </h2>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Business Intelligence & Data Analytics
            </p>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Silakan masuk untuk mengakses platform
          </p>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 font-bold text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                required
                className="block w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-300"
                placeholder="nama@dompetummat.or.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                required
                className="block w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-emerald-300 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk ke Platform'
              )}
            </button>
          </div>

          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-6">
            Hak akses diatur oleh Administrator
          </p>
        </form>
      </div>
    </div>
  );
}