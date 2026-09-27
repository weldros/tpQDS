import React, { useState } from "react";

import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Documentation from "./components/Documentation";
import QuantumControlDashboard from "./components/QuantumControlDashboard";
import AuthForm from "./components/AuthForm";
import Footer from "./components/Footer";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {activeTab !== "simulator" && (
        <Navbar setActiveTab={setActiveTab} activeTab={activeTab} />
      )}

      <main
        className={
          activeTab === "simulator"
            ? "h-screen overflow-hidden"
            : "min-h-screen"
        }
      >
        {activeTab === "home" && (
          <>
            <Home setActiveTab={setActiveTab} />

            <Footer setActiveTab={setActiveTab} />
          </>
        )}

        {activeTab === "docs" && (
          <>
            <Documentation />

            <Footer setActiveTab={setActiveTab} />
          </>
        )}

        {activeTab === "auth" && (
          <>
            <AuthForm setActiveTab={setActiveTab} />

            <Footer setActiveTab={setActiveTab} />
          </>
        )}

        {activeTab === "simulator" && (
          <div className="h-screen w-full overflow-hidden">
            <QuantumControlDashboard setActiveTab={setActiveTab} />
          </div>
        )}
      </main>
    </div>
  );
}
