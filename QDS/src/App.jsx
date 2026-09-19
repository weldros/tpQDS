import React, { useRef, useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import QuantumControlDashboard from "./components/QuantumControlDashboard";
import Documentation from "./components/Documentation";
import AuthForm from "./components/AuthForm";
import Footer from "./components/Footer";
import { X } from "lucide-react";

export default function App() {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showBanner, setShowBanner] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setActiveTab("home");
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offsetTop =
          element.getBoundingClientRect().top + window.pageYOffset - 110;
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    }, 50);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      `Successfully submitted ${activeTab === "login" ? "Login" : "Sign In"} form!`,
    );
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#faf9f5] text-neutral-900 font-sans antialiased selection:bg-[#f27121] selection:text-white flex flex-col justify-between relative overflow-x-hidden quantum-mesh"
    >
      {showBanner && (
        <div className="bg-[#f0ece1] border-b border-neutral-300 px-4 py-2.5 text-center text-xs text-neutral-600 flex items-center justify-center gap-2 relative z-50">
          <span className="text-[#f27121] font-mono font-semibold">
            NODE_SECURE:
          </span>
          <span>
            QDS Protocol v2.4 active for post-quantum cryptographic defense.
          </span>
          <a
            href="#what"
            onClick={(e) => scrollToSection(e, "what")}
            className="font-semibold underline underline-offset-2 text-[#f27121] hover:text-[#e94057]"
          >
            Inspect &rarr;
          </a>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scrollToSection={scrollToSection}
      />

      <main className="flex-grow relative z-10">
        {activeTab === "home" && (
          <Home setActiveTab={setActiveTab} scrollToSection={scrollToSection} />
        )}

        {activeTab === "simulator" && <QuantumControlDashboard />}

        {activeTab === "docs" && <Documentation />}

        {(activeTab === "signin" || activeTab === "login") && (
          <AuthForm
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
          />
        )}
      </main>

      <Footer setActiveTab={setActiveTab} scrollToSection={scrollToSection} />
    </div>
  );
}
