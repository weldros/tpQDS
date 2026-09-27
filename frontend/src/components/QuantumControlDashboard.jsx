import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";

export default function QuantumControlDashboard({ setActiveTab }) {
  const [telemetry, setTelemetry] = useState({
    entanglement: 90.5,
    teleportation: 83.8,
    noise: 7.1,
    degradation: 5.7,
  });

  const [bits, setBits] = useState({
    sent: "0011100100100100",
    received: "0011100000100100",
  });

  const [quantumState, setQuantumState] = useState("VERIFIED");
  const [errorRate, setErrorRate] = useState(6.3);
  const [threatLevel, setThreatLevel] = useState("NOISE");
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [transmissionLogs, setTransmissionLogs] = useState([
    "[05:38:20] SENT: 0011100100100100 | RECV: 0011100000100100 | ERR: 6.3% | NOISE",
    "[05:38:18] SENT: 111111001011111 | RECV: 111111000011111 | ERR: 6.3% | NOISE",
    "[05:38:16] SENT: 0110101110000111 | RECV: 0110100110000111 | ERR: 6.3% | NOISE",
    "[05:38:14] SENT: 0001111100001000 | RECV: 0001111000001000 | ERR: 6.3% | NOISE",
    "[05:38:12] SENT: 0001010110000001 | RECV: 0101010110000001 | ERR: 6.3% | NOISE",
  ]);
  const [auditReport, setAuditReport] = useState({
    timestamp: "27/9/2026, 11:08:20 am",
    avgEntanglement: 90.5,
    maxError: 6.3,
    finalStatus: "NOISE",
    totalPackets: 6,
    conclusion: "PASSED: Verified with minor environmental drift.",
  });
  const [activeNav, setActiveNav] = useState("telemetry");
  const [teleportStep, setTeleportStep] = useState(1);

  const containerRef = useRef(null);
  const streamTimerRef = useRef(null);
  const stageTimerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power2.out" },
      );
    }, containerRef);

    return () => {
      ctx.revert();
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, [activeNav]);

  const executeTransmissionCycle = () => {
    setQuantumState("SUPERPOSITION");

    const generatedBits = Array.from({ length: 16 }, () =>
      Math.random() > 0.5 ? "1" : "0",
    ).join("");
    const interceptAttempt = Math.random() > 0.7;

    let evaluatedBits = generatedBits;
    if (interceptAttempt) {
      const targetBitIndex = Math.floor(Math.random() * 16);
      evaluatedBits =
        generatedBits.substring(0, targetBitIndex) +
        (generatedBits[targetBitIndex] === "1" ? "0" : "1") +
        generatedBits.substring(targetBitIndex + 1);
    }

    setBits({ sent: generatedBits, received: evaluatedBits });

    let bitErrors = 0;
    for (let i = 0; i < 16; i++) {
      if (generatedBits[i] !== evaluatedBits[i]) bitErrors++;
    }

    const currentErrorRate = Number(((bitErrors / 16) * 100).toFixed(1));
    setErrorRate(currentErrorRate);

    let status = "SECURE";
    if (currentErrorRate > 10) {
      status = "INTERCEPTED";
    } else if (currentErrorRate > 0) {
      status = "NOISE";
    }
    setThreatLevel(status);

    const updatedMetrics = {
      entanglement: Number((100 - currentErrorRate * 1.5).toFixed(1)),
      teleportation: Number((97 - currentErrorRate * 2.1).toFixed(1)),
      noise: Number((currentErrorRate + 0.8).toFixed(1)),
      degradation: Number((currentErrorRate * 0.9).toFixed(1)),
    };
    setTelemetry(updatedMetrics);

    const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
    const logString = `[${timestamp}] SENT: ${generatedBits} | RECV: ${evaluatedBits} | ERR: ${currentErrorRate}% | ${status}`;

    setTransmissionLogs((prevLogs) => [logString, ...prevLogs.slice(0, 5)]);

    setTimeout(() => {
      setQuantumState(currentErrorRate > 10 ? "COLLAPSED" : "VERIFIED");
    }, 400);
  };

  const toggleLiveTelemetryStream = () => {
    if (isLiveActive) {
      clearInterval(streamTimerRef.current);
      clearInterval(stageTimerRef.current);
      setIsLiveActive(false);
      compileAuditReport();
    } else {
      setIsLiveActive(true);
      setAuditReport(null);
      executeTransmissionCycle();
      setTeleportStep(1);

      streamTimerRef.current = setInterval(() => {
        executeTransmissionCycle();
      }, 2500);

      stageTimerRef.current = setInterval(() => {
        setTeleportStep((prev) => (prev >= 5 ? 1 : prev + 1));
      }, 600);
    }
  };

  const compileAuditReport = () => {
    const reportData = {
      timestamp: new Date().toLocaleString(),
      avgEntanglement: telemetry.entanglement,
      maxError: errorRate,
      finalStatus: threatLevel,
      totalPackets: transmissionLogs.length + 1,
      conclusion:
        errorRate > 10 ? "REJECTED: Tampering detected." : "PASSED: Verified.",
    };
    setAuditReport(reportData);
  };

  const stepDetails = [
    { title: "Prepare", desc: "Alice prepares state", badge: "01" },
    { title: "Entangle", desc: "Bell pair shared", badge: "02" },
    { title: "Measure", desc: "Joint measurement", badge: "03" },
    { title: "Correct", desc: "Apply classical bits", badge: "04" },
    { title: "Verify", desc: "Bob verifies state", badge: "05" },
  ];

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-[#07090e] text-slate-100 font-sans flex flex-col md:flex-row select-none overflow-hidden"
    >
      <aside className="w-full md:w-64 bg-[#0b0e17] border-r border-slate-800/80 p-6 flex flex-col justify-between shrink-0 space-y-4 md:h-screen shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-3">
            <button
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab("home");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="text-xs uppercase tracking-wider text-indigo-400 hover:text-white transition-colors cursor-pointer font-mono font-semibold"
            >
              &larr; Return to Workspace
            </button>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono block mb-0.5">
                Architecture
              </span>
              <h2 className="text-base font-serif text-white tracking-tight">
                QDS Protocol
              </h2>
            </div>
          </div>

          <nav className="space-y-2 font-mono text-xs uppercase tracking-wider">
            <button
              onClick={() => setActiveNav("telemetry")}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold ${
                activeNav === "telemetry"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              01. Overview
            </button>

            <button
              onClick={() => setActiveNav("bitstream")}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold ${
                activeNav === "bitstream"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              02. Bitstreams
            </button>

            <button
              onClick={() => setActiveNav("engine")}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold ${
                activeNav === "engine"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              03. Engine Logic
            </button>

            <button
              onClick={() => setActiveNav("logs")}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold ${
                activeNav === "logs"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              04. Archive Log
            </button>
          </nav>
        </div>

        <div className="p-4 rounded-xl bg-[#07090e] border border-slate-800 space-y-1 font-mono">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 block">
            Stream Status
          </span>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isLiveActive ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`}
            />
            {isLiveActive ? "ACTIVE_TELEMETRY" : "SYSTEM_IDLE"}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 space-y-6 overflow-hidden bg-[#07090e] flex flex-col justify-between h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 shrink-0">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold block mb-1">
              Execution Node
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-white">
              Quantum Control Room
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={executeTransmissionCycle}
              disabled={isLiveActive}
              className="bg-[#0b0e17] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-mono uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer disabled:opacity-30 font-semibold shadow"
            >
              Test Single Pulse
            </button>

            <button
              onClick={toggleLiveTelemetryStream}
              className={`text-xs font-mono uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer font-bold shadow-lg ${
                isLiveActive
                  ? "bg-amber-500 text-slate-950 animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950"
              }`}
            >
              {isLiveActive ? "Halt Stream" : "Initialize Stream"}
            </button>
          </div>
        </div>

        {activeNav === "telemetry" && (
          <div className="space-y-5 shrink-0 overflow-y-auto max-h-[calc(100vh-140px)] pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                <span className="uppercase tracking-widest text-[10px] text-slate-400 block font-semibold">
                  Entanglement Purity
                </span>
                <div className="text-2xl font-serif text-white tracking-tight font-bold">
                  {telemetry.entanglement}%
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${telemetry.entanglement}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                <span className="uppercase tracking-widest text-[10px] text-slate-400 block font-semibold">
                  Teleportation Index
                </span>
                <div className="text-2xl font-serif text-white tracking-tight font-bold">
                  {telemetry.teleportation}%
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${telemetry.teleportation}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                <span className="uppercase tracking-widest text-[10px] text-slate-400 block font-semibold">
                  Channel Noise
                </span>
                <div className="text-2xl font-serif text-white tracking-tight font-bold">
                  {telemetry.noise}%
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-slate-400 h-full transition-all duration-300"
                    style={{ width: `${telemetry.noise * 10}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                <span className="uppercase tracking-widest text-[10px] text-slate-400 block font-semibold">
                  Degradation Factor
                </span>
                <div className="text-2xl font-serif text-white tracking-tight font-bold">
                  {telemetry.degradation}%
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-slate-400 h-full transition-all duration-300"
                    style={{ width: `${telemetry.degradation * 10}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono">
                <div>
                  <span className="text-xs text-indigo-400 uppercase tracking-widest block font-semibold">
                    Quantum Teleportation
                  </span>
                  <h3 className="text-sm font-serif text-white tracking-tight">
                    ALICE &rarr; QUANTUM CHANNEL &rarr; BOB
                  </h3>
                </div>
                <div className="text-xs text-slate-400 font-semibold font-mono">
                  Stage{" "}
                  <span className="text-indigo-400 font-bold">
                    {teleportStep}
                  </span>{" "}
                  of 5
                </div>
              </div>

              <div className="flex items-center justify-between px-8 py-4 bg-[#07090e] border border-slate-800 rounded-xl font-mono text-xs shadow-inner">
                <div className="flex flex-col items-center space-y-1.5">
                  <div
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-sm transition-all ${teleportStep >= 1 ? "border-indigo-500 text-indigo-300 bg-indigo-950/60 shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "border-slate-800 text-slate-600 bg-slate-900"}`}
                  >
                    A
                  </div>
                  <span className="text-xs text-white font-semibold uppercase">
                    Alice
                  </span>
                  <span className="text-[10px] text-indigo-400">SIGNER</span>
                </div>

                <div className="flex-1 px-8 flex flex-col items-center space-y-2 text-center">
                  <span
                    className={`text-[11px] tracking-wider uppercase font-semibold transition-colors ${teleportStep >= 2 ? "text-indigo-300 animate-pulse" : "text-slate-600"}`}
                  >
                    --- Quantum State (Bell Pair) ---
                  </span>
                  <div className="w-full border-t border-dashed border-indigo-500/40 my-1" />
                  <span
                    className={`text-[11px] tracking-wider uppercase font-semibold transition-colors ${teleportStep >= 4 ? "text-indigo-300 animate-pulse" : "text-slate-600"}`}
                  >
                    --- Classical Correction Bits ---
                  </span>
                </div>

                <div className="flex flex-col items-center space-y-1.5">
                  <div
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-sm transition-all ${teleportStep >= 5 ? "border-emerald-400 text-emerald-300 bg-emerald-950/60 shadow-[0_0_15px_rgba(52,211,153,0.5)]" : "border-slate-800 text-slate-600 bg-slate-900"}`}
                  >
                    B
                  </div>
                  <span className="text-xs text-white font-semibold uppercase">
                    Bob
                  </span>
                  <span className="text-[10px] text-emerald-400">VERIFIER</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
                {stepDetails.map((st, idx) => {
                  const currentIdx = idx + 1;
                  const isActive = teleportStep === currentIdx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setTeleportStep(currentIdx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1.5 shadow ${
                        isActive
                          ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500"
                          : "bg-[#07090e] border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-mono font-bold block ${isActive ? "text-indigo-400" : "text-slate-500"}`}
                      >
                        {st.badge}
                      </span>
                      <h4 className="text-xs font-serif text-white font-medium">
                        {st.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans font-light leading-snug">
                        {st.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {auditReport && (
              <div className="bg-[#0b0e17] border border-indigo-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-serif text-white font-semibold">
                    Comprehensive Audit Verdict
                  </h3>
                  <span className="text-xs font-mono text-indigo-400 font-semibold">
                    {auditReport.timestamp}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Avg Entanglement
                    </span>
                    <span className="text-white font-bold text-sm">
                      {auditReport.avgEntanglement}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Max Error Rate
                    </span>
                    <span className="text-white font-bold text-sm">
                      {auditReport.maxError}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Total Packets
                    </span>
                    <span className="text-white font-bold text-sm">
                      {auditReport.totalPackets}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Final Verdict
                    </span>
                    <span className="text-indigo-400 font-bold text-sm uppercase tracking-wider">
                      {auditReport.finalStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeNav === "bitstream" && (
          <div className="flex-1 flex items-center justify-center my-auto">
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
              <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5 shadow-xl">
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold block">
                    Wave Mechanics
                  </span>
                  <h3 className="text-xl font-serif text-white">
                    Quantum Collapse
                  </h3>
                  <p className="text-xs text-slate-400 font-sans font-light leading-relaxed">
                    External measurement attempts immediately collapse
                    superpositional states into classical values.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#07090e] border border-slate-800 text-center space-y-1 font-mono shadow-inner">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 block">
                    Current Vector State
                  </span>
                  <div className="text-sm font-serif text-indigo-400 font-bold">
                    {quantumState}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-[#0b0e17] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold block">
                    Bitstream Comparison
                  </span>
                  <h3 className="text-xl font-serif text-white">
                    Transmitted vs Received Data
                  </h3>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-[#07090e] border border-slate-800 flex items-center justify-between gap-4 shadow-inner">
                    <span className="text-[11px] text-slate-500 uppercase shrink-0 font-semibold">
                      Alice Sent
                    </span>
                    <div className="text-indigo-300 tracking-wider font-bold overflow-x-auto text-sm">
                      {bits.sent}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#07090e] border border-slate-800 flex items-center justify-between gap-4 shadow-inner">
                    <span className="text-[11px] text-slate-500 uppercase shrink-0 font-semibold">
                      Bob Recv
                    </span>
                    <div className="text-indigo-300 tracking-wider font-bold overflow-x-auto text-sm">
                      {bits.received}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === "engine" && (
          <div className="flex-1 flex items-center justify-center my-auto">
            <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-8 space-y-6 w-full max-w-xl shadow-xl shrink-0">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold block">
                  Deterministic Engine
                </span>
                <h3 className="text-xl font-serif text-white">
                  Threat Level Analysis
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono">
                <div className="p-5 rounded-xl bg-[#07090e] border border-slate-800 space-y-1.5 shadow-inner">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                    Calculated Error
                  </span>
                  <div className="text-3xl font-serif text-white font-bold">
                    {errorRate}%
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#07090e] border border-slate-800 space-y-1.5 shadow-inner">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                    System Security
                  </span>
                  <div className="text-sm font-bold text-indigo-400 pt-2 uppercase tracking-wider">
                    {threatLevel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === "logs" && (
          <div className="flex-1 flex items-center justify-center my-auto">
            <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5 w-full max-w-2xl shadow-xl shrink-0">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold block">
                  Event Ledger
                </span>
                <h3 className="text-xl font-serif text-white">
                  Telemetry Log History
                </h3>
              </div>

              <div className="bg-[#07090e] border border-slate-800 rounded-xl p-5 h-48 overflow-y-auto font-mono text-xs space-y-2.5 text-slate-300 shadow-inner">
                {transmissionLogs.length === 0 ? (
                  <span className="text-slate-500 italic font-light">
                    No historical entries available. Run a pulse or start
                    stream.
                  </span>
                ) : (
                  transmissionLogs.map((item, index) => (
                    <div key={index} className="font-medium text-slate-300">
                      {item}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
