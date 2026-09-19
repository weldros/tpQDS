import React from "react";
import { ArrowUpRight } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, scrollToSection }) {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 transition-all font-mono">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div
          className="flex items-center space-x-2.5 cursor-pointer group"
          onClick={() => setActiveTab("home")}
        >
          <span className="text-sm font-bold tracking-widest uppercase text-white">
            QDS &bull; SECURE
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-7 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <button
            onClick={() => {
              setActiveTab("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Platform
          </button>
          <button
            onClick={() => {
              setActiveTab("home");
              setTimeout(() => {
                const el = document.getElementById("pipeline");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 50);
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Architecture
          </button>
          <button
            onClick={() => {
              setActiveTab("simulator");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Testbed
          </button>
          <button
            onClick={() => {
              setActiveTab("docs");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`hover:text-white transition-colors cursor-pointer ${
              activeTab === "docs"
                ? "text-white underline underline-offset-4"
                : ""
            }`}
          >
            Documentation
          </button>
          <button
            onClick={() => {
              setActiveTab("simulator");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:text-amber-400 transition-colors cursor-pointer text-amber-500 font-bold"
          >
            Control Suite
          </button>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setActiveTab("login");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer hidden sm:block"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("simulator");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="bg-amber-500 text-neutral-950 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer font-mono"
          >
            Get Started <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
