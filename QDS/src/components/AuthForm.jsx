import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function AuthForm({
  activeTab,
  setActiveTab,
  formData,
  setFormData,
  handleSubmit,
}) {
  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 font-sans pt-32 pb-24 px-6 relative overflow-hidden flex items-center justify-center">
      {/* Background Decorative Glow & Grids */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.12),transparent_60%)]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Return Button */}
        <button
          onClick={() => setActiveTab("home")}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Workspace
        </button>

        {/* Auth Container Card */}
        <div className="bg-[#0b0e17] border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Security Indicator Badge */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6 font-mono text-xs">
            <span className="text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Secure Node Auth
            </span>
            <span className="text-emerald-400 font-semibold text-[10px]">
              [ENCRYPTED]
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-tight mb-2">
            {activeTab === "login"
              ? "Access Control Node"
              : "Register Node Identity"}
          </h1>
          <p className="text-xs text-slate-400 font-light mb-6">
            {activeTab === "login"
              ? "Authenticate with your security credentials to access the simulator."
              : "Create a new cryptographic profile for quantum transmission auditing."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {activeTab === "signin" && (
              <div className="space-y-1.5">
                <label className="block uppercase text-slate-400 tracking-wider text-[10px]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Alex Vance"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#07090e] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block uppercase text-slate-400 tracking-wider text-[10px]">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="alex@quantum.org"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#07090e] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block uppercase text-slate-400 tracking-wider text-[10px]">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#07090e] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950 font-bold mt-2"
            >
              {activeTab === "login"
                ? "Initialize Session &rarr;"
                : "Register Account &rarr;"}
            </button>
          </form>

          <div className="mt-6 text-center font-mono text-xs text-slate-400 border-t border-slate-800 pt-6">
            {activeTab === "login" ? (
              <p>
                Don't have an active node identity?{" "}
                <button
                  onClick={() => setActiveTab("signin")}
                  className="text-indigo-400 font-semibold hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            ) : (
              <p>
                Already have an established identity?{" "}
                <button
                  onClick={() => setActiveTab("login")}
                  className="text-indigo-400 font-semibold hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
