import React from "react";
import { ArrowUpRight, Activity } from "lucide-react";

export default function Hero({ heroRef, scrollToSection, setActiveTab }) {
  return (
    <section
      ref={heroRef}
      className="pt-28 pb-20 px-6 text-center max-w-5xl mx-auto relative"
    >
      <div className="absolute top-10 left-16 w-16 h-16 bg-gradient-to-br from-sky-400/20 to-blue-500/20 border border-sky-400/30 rounded-xl blur-xs shadow-sm hidden lg:block pointer-events-none animate-pulse" />
      <div className="absolute top-32 right-20 w-20 h-20 bg-gradient-to-tr from-indigo-400/20 to-purple-500/20 border border-purple-400/30 rounded-2xl blur-xs shadow-sm hidden lg:block pointer-events-none" />
      <div className="absolute bottom-16 left-1/4 w-14 h-14 bg-gradient-to-r from-blue-400/20 to-sky-300/20 border border-sky-300/30 rounded-lg blur-xs shadow-sm hidden lg:block pointer-events-none" />

      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal font-serif tracking-tight text-neutral-950 mb-6 leading-[1.12] relative z-10">
        Classical Is Vulnerable. <br />
        Secure Your Signatures With <br />
        <span className="italic text-sky-600">Quantum Physics.</span>
      </h1>

      <p className="text-base sm:text-lg text-neutral-600 max-w-xl mx-auto mb-10 font-light leading-relaxed relative z-10">
        Information-theoretic security over dedicated Bell-state quantum
        teleportation channels.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
        <button
          onClick={() => {
            setActiveTab("simulator");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-semibold uppercase tracking-wider px-7 py-3.5 rounded-full shadow-md hover:opacity-95 transition-all font-mono cursor-pointer"
        >
          Run Quantum Simulator <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
        <a
          href="#what"
          onClick={(e) => scrollToSection(e, "what")}
          className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-neutral-800 text-xs font-semibold uppercase tracking-wider px-7 py-3.5 rounded-full hover:border-neutral-900 transition-all shadow-sm font-mono"
        >
          View Telemetry Performance
        </a>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-16 relative z-10">
        <div className="w-full bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent border border-[#e2ddd5] rounded-3xl p-8 sm:p-12 relative overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-4 shadow-md">
              <Activity className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-xl font-serif text-neutral-900 mb-2">
              Entanglement Topology & Teleportation Node
            </h3>
            <p className="text-sm text-neutral-600 max-w-md mx-auto mb-8">
              Real-time Pauli basis verification and projective measurement
              tracking across sender-receiver endpoints.
            </p>

            <div className="w-full max-w-2xl flex items-center justify-between relative px-4">
              <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-neutral-300 -translate-y-1/2 z-0" />
              <div className="w-6 h-6 bg-neutral-900 text-white text-xs flex items-center justify-center rounded border border-white z-10 shadow font-mono">
                A
              </div>
              <div className="w-6 h-6 bg-sky-600 text-white text-xs flex items-center justify-center rounded border border-white z-10 shadow animate-pulse font-mono">
                Ψ
              </div>
              <div className="w-6 h-6 bg-neutral-900 text-white text-xs flex items-center justify-center rounded border border-white z-10 shadow font-mono">
                B
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
