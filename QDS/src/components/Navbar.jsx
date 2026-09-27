import React from "react";

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-[#07090e]/95 backdrop-blur-xl border-b border-slate-800/80 font-sans">
      <div className="h-full max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-20 flex items-center justify-between">

        <button
          onClick={() => {
            setActiveTab("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 cursor-pointer text-left"
        >
          <span className="text-sm font-serif tracking-tight text-white font-semibold">
            QDS<span className="text-indigo-400">.</span>ENGINE
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider">
          <button
            onClick={() => {
              setActiveTab("docs");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`relative py-2 transition-colors cursor-pointer ${
              activeTab === "docs"
                ? "text-indigo-400 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Documentation
            {activeTab === "docs" && (
              <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("simulator");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`relative py-2 transition-colors cursor-pointer ${
              activeTab === "simulator"
                ? "text-indigo-400 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Test Bed
            {activeTab === "simulator" && (
              <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </nav>

        <div className="flex items-center gap-6 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b0e17] border border-slate-800">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              System Online
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
    </header>
  );
}
