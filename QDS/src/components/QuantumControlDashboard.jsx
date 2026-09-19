import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  Terminal,
  Cpu,
  RefreshCw,
  Server,
  Radio,
  Lock,
  Zap,
} from "lucide-react";

export default function QuantumControlDashboard() {
  const [activeTab, setActiveTab] = useState("telemetry");
  const [isRunning, setIsRunning] = useState(false);
  const [nodeState, setNodeState] = useState("ACTIVE");
  const [packets, setPackets] = useState({
    transferred: 4096,
    integrityCheck: "99.998%",
    bitErrorRate: "0.0012%",
    qubitDecoherence: "0.04 ms",
  });

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      timestamp: "02:14:02",
      severity: "OK",
      source: "NODE_A_PHY",
      event: "Bell-state polarization matched across fiber channel.",
    },
    {
      id: 2,
      timestamp: "02:14:08",
      severity: "OK",
      source: "BASIS_VERIFIER",
      event: "Pauli-X and Pauli-Z projection measurement verified.",
    },
    {
      id: 3,
      timestamp: "02:14:15",
      severity: "SYS",
      source: "BUFFER_CORE",
      event: "Quantum transmission window synchronized successfully.",
    },
  ]);

  const consoleRef = useRef(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [auditLogs]);

  const executeNodeTest = () => {
    if (isRunning) return;
    setIsRunning(true);
    setNodeState("PROBING");

    setAuditLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        severity: "SYS",
        source: "EXEC_ENGINE",
        event: "Initiating deterministic signature token transmission...",
      },
    ]);

    setTimeout(() => {
      setAuditLogs((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          timestamp: new Date().toLocaleTimeString(),
          severity: "OK",
          source: "VERIFICATION_LOGIC",
          event: "Information-theoretic bound satisfied. Token accepted.",
        },
      ]);
      setNodeState("SECURED");
      setIsRunning(false);
    }, 1400);
  };

  const simulateChannelIntrusion = () => {
    if (isRunning) return;
    setIsRunning(true);
    setNodeState("INTERCEPTED");

    setAuditLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        severity: "ALERT",
        source: "PHY_SENSOR",
        event: "Anomalous photon count shift detected on fiber trunk.",
      },
      {
        id: Date.now() + 1,
        timestamp: new Date().toLocaleTimeString(),
        severity: "ALERT",
        source: "HW_INTERLOCK",
        event: "No-cloning threshold violated: Superposition state collapsed.",
      },
    ]);

    setTimeout(() => {
      setAuditLogs((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          timestamp: new Date().toLocaleTimeString(),
          severity: "DANGER",
          source: "GATE_LOGIC",
          event:
            "REJECTED: Unauthorized interception dropped by physical rule.",
        },
      ]);
      setNodeState("BLOCKED");
      setIsRunning(false);
    }, 1600);
  };

  return (
    <div className="pt-28 pb-24 px-6 max-w-7xl mx-auto relative overflow-hidden font-mono">
      <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      <div className="mb-8 pb-6 border-b border-neutral-300 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-700 font-bold uppercase tracking-widest mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> SECURE_NODE_ALPHA //
            DIRECT_CHANNEL
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-neutral-950 font-normal">
            Deterministic Teleportation & Cryptographic Testbed
          </h1>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-300 shadow-2xs text-xs">
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "telemetry" ? "bg-neutral-950 text-white font-semibold" : "text-neutral-600 hover:text-neutral-950"}`}
          >
            Topology & Diagnostics
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "audit" ? "bg-neutral-950 text-white font-semibold" : "text-neutral-600 hover:text-neutral-950"}`}
          >
            Hardware Console Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-300 rounded-2xl p-6 shadow-xs relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-sky-600 rounded-t-2xl" />
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">
              OPERATIONAL CONTROLS
            </span>
            <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-600" /> Command & Interlock
            </h3>

            <div className="space-y-3">
              <button
                onClick={executeNodeTest}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`}
                />
                Transmit Test Token
              </button>

              <button
                onClick={simulateChannelIntrusion}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Trigger Fiber Probe Attack
              </button>
            </div>
          </div>

          <div className="bg-white border border-neutral-300 rounded-2xl p-6 shadow-xs space-y-4">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">
              HARDWARE TELEMETRY
            </span>
            <h3 className="text-lg font-bold text-neutral-950 flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Zap className="w-4 h-4 text-sky-600" /> Physical Parameters
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#faf9f5] p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase text-neutral-400 block mb-1">
                  Active Bell Pairs
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {packets.transferred}
                </span>
              </div>
              <div className="bg-[#faf9f5] p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase text-neutral-400 block mb-1">
                  Channel Fidelity
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  {packets.integrityCheck}
                </span>
              </div>
              <div className="bg-[#faf9f5] p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase text-neutral-400 block mb-1">
                  Bit Error Rate
                </span>
                <span className="text-sm font-bold text-sky-700">
                  {packets.bitErrorRate}
                </span>
              </div>
              <div className="bg-[#faf9f5] p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase text-neutral-400 block mb-1">
                  Decoherence Time
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {packets.qubitDecoherence}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-neutral-300 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${nodeState === "SECURED" || nodeState === "BLOCKED" ? "bg-emerald-500 animate-pulse" : nodeState === "PROBING" ? "bg-amber-500 animate-pulse" : "bg-sky-600"}`}
              />
              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">
                  Hardware Interlock State
                </span>
                <span className="text-xs font-bold text-neutral-950 uppercase tracking-wide">
                  {nodeState === "ACTIVE" && "Node Synchronized / Standby"}
                  {nodeState === "PROBING" &&
                    "Evaluating Pauli Basis Matrices..."}
                  {nodeState === "SECURED" &&
                    "Token Validated via Quantum Matrix"}
                  {nodeState === "INTERCEPTED" &&
                    "Physical Probe / Eavesdropping Detected"}
                  {nodeState === "BLOCKED" &&
                    "Transmission Cleared & Discarded"}
                </span>
              </div>
            </div>
            <span className="text-[11px] uppercase bg-[#faf9f5] border border-neutral-200 px-3 py-1 rounded-lg text-neutral-600">
              Deterministic Logic Only
            </span>
          </div>

          {activeTab === "telemetry" ? (
            <div className="space-y-6">
              <div className="bg-white border border-neutral-300 rounded-2xl p-8 shadow-xs space-y-6">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">
                    TOPOLOGY ARCHITECTURE
                  </span>
                  <h3 className="text-xl font-bold text-neutral-950 flex items-center gap-2">
                    <Server className="w-5 h-5 text-sky-600" /> End-to-End Node
                    Architecture
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 font-light leading-relaxed font-sans">
                  Direct hardware-level schematic showing cryptographic token
                  handling across isolated fiber nodes using entanglement
                  protocols.
                </p>

                <div className="bg-[#faf9f5] border border-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="w-full max-w-md flex items-center justify-between relative px-4 z-10 my-4">
                    <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-neutral-300 -translate-y-1/2 z-0" />

                    <div className="bg-white border border-neutral-300 px-4 py-3 rounded-xl shadow-2xs text-center z-15">
                      <span className="text-[9px] text-neutral-400 block uppercase">
                        Endpoint
                      </span>
                      <span className="text-xs font-bold text-neutral-900">
                        NODE_A
                      </span>
                    </div>

                    <div className="bg-neutral-950 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm z-15">
                      Ψ⁺
                    </div>

                    <div className="bg-white border border-neutral-300 px-4 py-3 rounded-xl shadow-2xs text-center z-15">
                      <span className="text-[9px] text-neutral-400 block uppercase">
                        Endpoint
                      </span>
                      <span className="text-xs font-bold text-neutral-900">
                        NODE_B
                      </span>
                    </div>
                  </div>

                  <div className="text-center text-[11px] text-neutral-500 mt-2 z-10 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-600" /> Protocol
                    Status:{" "}
                    <span className="text-emerald-700 font-bold">
                      Encrypted via Bell-State Parameters
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-sky-50/50 via-white to-neutral-50 border-2 border-dashed border-sky-300 rounded-2xl p-8 text-center space-y-3">
                <span className="text-[10px] text-sky-700 uppercase tracking-widest block font-bold">
                  DAEMON HOOK
                </span>
                <div className="w-10 h-10 mx-auto rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-neutral-900 uppercase">
                  Backend Simulator Daemon Integration Slot
                </h4>
                <p className="text-xs text-neutral-600 max-w-md mx-auto font-sans font-light leading-relaxed">
                  Placeholder reserved for external hardware daemon connection
                  scripts, real-time telemetry streaming hooks, and custom
                  cryptographic algorithm modules.
                </p>
                <div className="inline-block px-3 py-1 bg-sky-100 text-sky-800 text-[10px] rounded-md border border-sky-200 uppercase font-bold">
                  Status: Awaiting Daemon Socket
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-950 text-neutral-200 rounded-2xl p-6 text-xs shadow-lg border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 text-neutral-400">
                <span className="flex items-center gap-2 text-sky-400 font-bold">
                  <Terminal className="w-4 h-4" />{" "}
                  root@qds-daemon:/var/log/crypto_stream#
                </span>
                <span className="text-[10px] uppercase bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800 text-emerald-400">
                  Buffer Active
                </span>
              </div>

              <div
                ref={consoleRef}
                className="space-y-3 overflow-y-auto max-h-72 pr-2 font-mono text-[11px]"
              >
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 leading-relaxed border-b border-neutral-900 pb-2"
                  >
                    <span className="text-neutral-500 shrink-0">
                      [{log.timestamp}]
                    </span>
                    <span
                      className={`font-bold shrink-0 px-1.5 py-0.5 rounded text-[9px] ${
                        log.severity === "OK"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : log.severity === "ALERT" ||
                              log.severity === "DANGER"
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : log.severity === "SYS"
                              ? "bg-sky-950 text-sky-400 border border-sky-800"
                              : "bg-neutral-900 text-amber-400"
                      }`}
                    >
                      {log.severity}
                    </span>
                    <span className="text-neutral-400 font-bold">
                      [{log.source}]
                    </span>
                    <span className="text-neutral-300">{log.event}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-900 flex justify-between text-[10px] text-neutral-500">
                <span>Buffer Size: {auditLogs.length} Entries</span>
                <span className="text-emerald-400 font-bold">
                  Hardware Status: Nominal
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
