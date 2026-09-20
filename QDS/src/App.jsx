import React, { useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import QuantumControlDashboard from "./components/QuantumControlDashboard";
import Documentation from "./components/Documentation";
import AuthForm from "./components/AuthForm";
import Footer from "./components/Footer";

export default function App() {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState("home");
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
      className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased selection:bg-amber-500 selection:text-neutral-950 flex flex-col justify-between relative overflow-x-hidden"
    >
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
