import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Documentation from "./components/Documentation";
import QuantumControlDashboard from "./components/QuantumControlDashboard";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/dashboard") {
        setActiveTab("simulator");
      } else if (path === "/docs") {
        setActiveTab("docs");
      } else {
        setActiveTab("home");
      }
    };

    handlePopState();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const changeTab = (tab) => {
    setActiveTab(tab);
    if (tab === "simulator") {
      window.history.pushState({}, "", "/dashboard");
    } else if (tab === "docs") {
      window.history.pushState({}, "", "/docs");
    } else {
      window.history.pushState({}, "", "/home");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Conditionally render Navbar so it is hidden when activeTab is 'simulator' (/dashboard) */}
      {activeTab !== "simulator" && (
        <Navbar activeTab={activeTab} setActiveTab={changeTab} />
      )}

      {activeTab === "home" && <Home setActiveTab={changeTab} />}
      {activeTab === "docs" && <Documentation />}
      {activeTab === "simulator" && (
        <QuantumControlDashboard setActiveTab={changeTab} />
      )}
    </div>
  );
}
