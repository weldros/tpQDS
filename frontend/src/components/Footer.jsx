import React from "react";
import { Code, Mail, ShieldAlert, Terminal } from "lucide-react";

export default function Footer({ setActiveTab }) {
  return (
    <footer className="relative bg-[#07090e] border-t border-slate-800/80 text-slate-400 font-sans overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_50%)]" />

      <div className="relative max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-indigo-500/30 bg-indigo-950/60 flex items-center justify-center text-indigo-400 font-serif font-bold text-sm shadow-md">
                Q
              </div>
              <div>
                <div className="text-base font-serif tracking-tight text-white font-medium">
                  QDS<span className="text-indigo-400">.</span>ENGINE
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                  Quantum Digital Security
                </div>
              </div>
            </div>

            <p className="max-w-md text-xs leading-relaxed text-slate-400 font-light">
              A high-performance quantum cryptographic security framework
              engineered for information-theoretic digital signature
              verification, threat detection, and zero-trust transmission
              analysis.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-medium">
                Bell-State Validation Active
              </span>
            </div>
          </div>

          <div className="space-y-4 font-mono">
            <div className="flex items-center gap-2 text-white">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs uppercase tracking-wider font-semibold">
                Navigation
              </h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <button
                onClick={() => {
                  setActiveTab("home");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="block text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-wider text-left cursor-pointer"
              >
                Platform Overview
              </button>

              <button
                onClick={() => {
                  setActiveTab("docs");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="block text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-wider text-left cursor-pointer"
              >
                Documentation
              </button>

              <button
                onClick={() => {
                  setActiveTab("simulator");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="block text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-wider text-left cursor-pointer"
              >
                Test Bed
              </button>

              <button
                onClick={() => {
                  setActiveTab("home");
                  setTimeout(() => {
                    const element = document.getElementById("pipeline");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 50);
                }}
                className="block text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-wider text-left cursor-pointer"
              >
                Security Architecture
              </button>
            </div>
          </div>

          <div className="space-y-4 font-mono">
            <div className="flex items-center gap-2 text-white">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs uppercase tracking-wider font-semibold">
                System Status
              </h4>
            </div>

            <div className="space-y-2.5 text-xs bg-[#0b0e17] border border-slate-800/80 p-4 rounded-xl">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500 uppercase text-[10px]">
                  Core
                </span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500 uppercase text-[10px]">
                  Telemetry
                </span>
                <span className="text-indigo-400 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500 uppercase text-[10px]">
                  Threat Level
                </span>
                <span className="text-emerald-400 font-bold">LOW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase text-[10px]">
                  Version
                </span>
                <span className="text-slate-300 font-bold">V1.0.0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="uppercase tracking-widest text-slate-400 font-semibold">
              QDS_ENGINE
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="uppercase tracking-widest">
              SECURE TRANSMISSION FRAMEWORK
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              title="GitHub Repository"
              className="w-9 h-9 rounded-xl border border-slate-800 bg-[#0b0e17] flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500 transition-all cursor-pointer shadow-sm"
            >
              <Code className="w-4 h-4" />
            </a>

            <a
              href="mailto:contact@qds-secure.io"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-[#0b0e17] text-slate-300 hover:text-white hover:border-indigo-500 transition-all cursor-pointer shadow-sm text-xs font-medium"
            >
              <Mail className="w-4 h-4 text-indigo-400" />
              contact@qds-secure.io
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-[11px] text-slate-500">
          <span>
            Quantum Digital Signature Threat Detection Engine &copy; 2026
          </span>
          <span className="text-emerald-400 font-medium tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ALL TELEMETRY VERIFIED
          </span>
        </div>
      </div>
    </footer>
  );
}
