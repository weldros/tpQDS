import React from "react";

export default function Navbar({ activeTab, setActiveTab, scrollToSection }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 transition-all font-mono">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div
          className="flex items-center space-x-2.5 cursor-pointer group"
          onClick={() => setActiveTab("home")}
        >
          <span className="text-base font-serif font-bold tracking-tight text-white">
            QDS<span className="text-amber-500">.</span>ENGINE
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-neutral-400">
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
            className={`hover:text-white transition-colors cursor-pointer ${
              activeTab === "simulator"
                ? "text-white underline underline-offset-4"
                : ""
            }`}
          >
            Test Bed
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
            Siemens
          </button>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setActiveTab("login");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}
