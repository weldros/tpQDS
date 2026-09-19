import React from "react";
import { Code, Globe, MessageSquare, Mail, ShieldAlert } from "lucide-react";

export default function Footer({ setActiveTab, scrollToSection }) {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-800 py-16 px-6 text-neutral-400 relative z-10 font-mono">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2.5">
            <span className="text-sm font-bold tracking-widest uppercase text-white">
              QDS &bull; QUANTUM PROTOCOL
            </span>
          </div>
          <p className="text-xs text-neutral-400 max-w-sm font-light leading-relaxed font-sans">
            Next-generation quantum cryptographic framework guaranteeing
            absolute post-quantum digital signature verification via
            information-theoretic security principles.
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-500 pt-2 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Zero-Trust Bell
            State Validation Active
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-white mb-4 font-bold">
            Navigation
          </h4>
          <ul className="space-y-2.5 text-xs text-neutral-400 font-sans">
            <li>
              <button
                onClick={() => {
                  setActiveTab("home");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Platform Overview
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab("simulator");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Control Simulator
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab("docs");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Documentation
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-white mb-4 font-bold">
            Secure Nodes
          </h4>
          <div className="flex space-x-3 mb-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500 text-amber-500 rounded-xl transition-all shadow-2xs"
            >
              <Code className="w-4 h-4" />
            </a>
            <a
              href="https://qds-secure.io"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500 text-amber-500 rounded-xl transition-all shadow-2xs"
            >
              <Globe className="w-4 h-4" />
            </a>
            <a
              href="https://forum.qds-secure.io"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500 text-amber-500 rounded-xl transition-all shadow-2xs"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
          </div>
          <a
            href="mailto:contact@qds-secure.io"
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-amber-500" />{" "}
            contact@qds-secure.io
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-neutral-900 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 text-neutral-500">
        <div>Quantum Digital Signature Threat Detection Engine © 2026</div>
        <div className="text-amber-500 font-bold">All telemetry verified.</div>
      </div>
    </footer>
  );
}
