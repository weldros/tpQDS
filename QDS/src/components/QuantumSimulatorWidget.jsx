import React, { useEffect, useRef, useState } from "react";
import {
  Terminal,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Lock,
  Radio,
} from "lucide-react";

export default function QuantumSimulatorWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([
    {
      id: 1,
      text: "System initialized. Bell-state pairs generated: |Φ⁺⟩",
      type: "info",
    },
    {
      id: 2,
      text: "Node A & Node B quantum channel established.",
      type: "success",
    },
    {
      id: 3,
      text: "Ready for signature token teleportation and audit.",
      type: "info",
    },
  ]);
  const [status, setStatus] = useState("IDLE");
  const terminalRef = useRef(null);

  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatus("RUNNING");
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "Executing projective measurements & Pauli correction...",
        type: "warn",
      },
    ]);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Checking statistical threshold bounds against no-cloning theorem...",
          type: "info",
        },
        {
          id: Date.now() + 2,
          text: "SUCCESS: Signature verified with absolute information-theoretic security.",
          type: "success",
        },
      ]);
      setStatus("SECURE");
      setIsRunning(false);
    }, 2000);
  };

  const simulateAttack = () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatus("ATTACK_DETECTED");
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "WARNING: Eavesdropper intercept detected on quantum fiber channel!",
        type: "error",
      },
    ]);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Superposition collapsed instantly. Forgery blocked by physical laws.",
          type: "error",
        },
        {
          id: Date.now() + 2,
          text: "ALERT: Compromised signature token deterministically rejected.",
          type: "error",
        },
      ]);
      setStatus("REJECTED");
      setIsRunning(false);
    }, 1800);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full max-w-[96%] mx-auto my-24 bg-[#f4f1ea] border border-[#dfdad0] p-8 sm:p-14 shadow-sm rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#dfdad0] pb-8 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-600">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />{" "}
            Interactive Simulation Sandbox
          </div>
          <h3 className="text-3xl sm:text-4xl font-serif text-neutral-950 tracking-tight">
            Live Quantum Teleportation Testbed
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-mono uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`}
            />{" "}
            Run Verification
          </button>
          <button
            onClick={simulateAttack}
            disabled={isRunning}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Simulate Attack
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Status Dashboard Panel */}
        <div className="lg:col-span-4 bg-white border border-[#dfdad0] p-6 sm:p-8 rounded-xl flex flex-col justify-between space-y-6 shadow-2xs">
          <div className="space-y-5">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 block border-b border-neutral-100 pb-3">
              Node Status Dashboard
            </span>

            <div className="flex items-center justify-between bg-[#faf9f5] p-4 border border-[#e8e4dc] rounded-lg">
              <span className="text-xs font-mono text-neutral-500 uppercase">
                Current State
              </span>
              <span
                className={`text-xs font-mono font-bold px-3 py-1 rounded-md ${
                  status === "SECURE"
                    ? "bg-emerald-100 text-emerald-800"
                    : status === "REJECTED"
                      ? "bg-rose-100 text-rose-800"
                      : status === "RUNNING"
                        ? "bg-amber-100 text-amber-800 animate-pulse"
                        : "bg-neutral-200 text-neutral-800"
                }`}
              >
                {status}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-mono text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <Lock className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>Information-Theoretic Security Active</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-mono text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>AI-Free Deterministic Logic</span>
              </div>
            </div>
          </div>

          <p className="text-xs font-light text-neutral-500 leading-relaxed border-t border-neutral-100 pt-4">
            Test how the framework reacts instantly to valid transmissions
            versus malicious channel interception attempts.
          </p>
        </div>

        {/* Live Terminal Output Screen */}
        <div className="lg:col-span-8 bg-neutral-950 text-neutral-200 p-6 sm:p-8 rounded-xl font-mono text-xs flex flex-col justify-between border border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4 text-neutral-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />{" "}
              qds-secure-simulator@node-alpha:~
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 uppercase">
                Live Stream
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <div
            ref={terminalRef}
            className="space-y-3 overflow-y-auto max-h-60 pr-2 my-2"
          >
            {logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2.5 leading-relaxed ${
                  log.type === "success"
                    ? "text-emerald-400 font-medium"
                    : log.type === "error"
                      ? "text-rose-400 font-semibold"
                      : log.type === "warn"
                        ? "text-amber-300 font-medium"
                        : "text-neutral-300"
                }`}
              >
                <span className="text-neutral-600 select-none">&gt;</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-800 text-[11px] text-neutral-500 flex justify-between uppercase tracking-wider">
            <span>Protocol: Bell-State Entanglement v2.4</span>
            <span className="text-emerald-400 font-medium">
              Status: Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
