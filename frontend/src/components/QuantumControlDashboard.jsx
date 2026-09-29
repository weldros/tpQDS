import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";

export default function QuantumControlDashboard({ setActiveTab }) {
  const [telemetry, setTelemetry] = useState({
    entanglement: 0,
    noise: 0,
    degradation: 0,
  });

  const [bits, setBits] = useState({
    sent: "0000000000000000",
    received: "0000000000000000",
  });

  const [quantumState, setQuantumState] = useState("IDLE");
  const [errorRate, setErrorRate] = useState(0);
  const [threatLevel, setThreatLevel] = useState("IDLE");
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [transmissionLogs, setTransmissionLogs] = useState([]);
  const [auditReport, setAuditReport] = useState(null);
  const [activeNav, setActiveNav] = useState("telemetry");
  const [teleportStep, setTeleportStep] = useState(1);

  const [historyData, setHistoryData] = useState([]);

  const [isPulseModalOpen, setIsPulseModalOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [pulseResult, setPulseResult] = useState(null);

  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [livePayloads, setLivePayloads] = useState([]);
  const [liveAttackAlert, setLiveAttackAlert] = useState(null);

  const [sliderNoise, setSliderNoise] = useState(5);
  const [lineTooltip, setLineTooltip] = useState(null);
  const [selectedAttack, setSelectedAttack] = useState("FORGERY");
  const [attackRate, setAttackRate] = useState(50);

  const containerRef = useRef(null);
  const streamTimerRef = useRef(null);
  const stageTimerRef = useRef(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket("ws://127.0.0.1:8000/ws/stream");

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.payload) {
        setLivePayloads((prev) => [
          {
            timestamp: new Date().toLocaleTimeString(),
            text: data.payload,
            status: "TRANSMITTING",
          },
          ...prev.slice(0, 19),
        ]);
      }

      if (data.step) {
        setTransmissionLogs((prev) => [
          `[LIVE] ${data.step}`,
          ...prev.slice(0, 5),
        ]);
        
        if (data.step.includes("Hashing")) setTeleportStep(1);
        else if (data.step.includes("Entangling")) setTeleportStep(2);
        else if (data.step.includes("Measuring")) setTeleportStep(3);
        else if (data.step.includes("Applying Pauli")) setTeleportStep(4);
        else if (data.step.includes("Transmission Complete")) setTeleportStep(5);
      }

      if (data.metrics) {
        const currentQber = data.metrics.qber;
        const currentFidelity = data.metrics.fidelity;
        const hasError = currentQber > 5 || data.metrics.verdict === "REJECT";

        setErrorRate(currentQber);
        setTelemetry({
          entanglement: currentFidelity,
          noise: currentQber,
          degradation: Number((currentQber * 1.5).toFixed(1)),
        });
        setThreatLevel(
          data.metrics.verdict === "REJECT" ? "INTERCEPTED" : "SECURE",
        );

        setHistoryData((prev) => {
          const packetIndex = prev.length > 0 ? prev[prev.length - 1].index + 1 : 1;
          return [
            ...prev.slice(-49),
            { index: packetIndex, errorRate: currentQber, fidelity: currentFidelity, hasError, attackName: data.metrics.attack_type || null },
          ];
        });

        setAuditReport({
          timestamp: new Date().toLocaleString(),
          avgEntanglement: currentFidelity,
          maxError: currentQber,
          finalStatus:
            data.metrics.verdict === "REJECT" ? "INTERCEPTED" : "SECURE",
          totalPackets: transmissionLogs.length + 1,
          conclusion:
            data.metrics.verdict === "REJECT"
              ? `REJECTED: Tampering detected (p < ${Number(data.metrics.p_value).toExponential(2)}).`
              : `PASSED: Verified against threshold (q0=${Number(data.metrics.dynamic_threshold).toFixed(1)}%).`,
        });

        setLivePayloads((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[0].status =
            data.metrics.verdict === "REJECT" ? 
            (data.metrics.attack_type ? `INTERCEPTED [${data.metrics.attack_type}]` : "INTERCEPTED [NOISE]") 
            : "DELIVERED";
          return updated;
        });
      }

      if (data.status === "HALTED") {
        setIsLiveActive(false);
        setLiveAttackAlert({ 
          reason: data.halt_reason || "ATTACK",
          metrics: data.metrics 
        });
      }
    };

    setWs(websocket);
    return () => websocket.close();
  }, []);

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

    const dynamicVariation = Number((Math.random() * 2).toFixed(1));
    const currentErrorRate = Math.max(
      0.2,
      Number((sliderNoise * 0.3 + dynamicVariation).toFixed(1)),
    );
    setErrorRate(currentErrorRate);

    let status = "SECURE";
    if (currentErrorRate > 4.5 || sliderNoise > 8) {
      status = "INTERCEPTED";
    } else if (currentErrorRate > 1.5) {
      status = "NOISE";
    }
    setThreatLevel(status);

    const fidelity = Number((100 - currentErrorRate * 1.8).toFixed(1));
    const noiseVal = Number((currentErrorRate + 0.4).toFixed(1));
    const degradationVal = Number((currentErrorRate * 0.9).toFixed(1));

    setTelemetry({
      entanglement: Math.max(40, fidelity),
      noise: noiseVal,
      degradation: degradationVal,
    });

    const hasError = currentErrorRate > 4.5 || status === "INTERCEPTED";
    const packetIndex = historyData.length + 1;
    setHistoryData((prev) => [
      ...prev.slice(-49),
      { index: packetIndex, errorRate: currentErrorRate, fidelity: 100 - (currentErrorRate * 2), hasError },
    ]);

    const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
    const logString = `[${timestamp}] SENT: ${generatedBits} | ERR: ${currentErrorRate}% | ${status}`;

    setTransmissionLogs((prevLogs) => [logString, ...prevLogs.slice(0, 15)]);

    const auditData = {
      timestamp: new Date().toLocaleString(),
      avgEntanglement: Math.max(40, fidelity),
      maxError: currentErrorRate,
      finalStatus: status,
      totalPackets: transmissionLogs.length + 1,
      conclusion:
        currentErrorRate > 4.5
          ? "REJECTED: Tampering detected."
          : "PASSED: Verified within domain limit.",
    };
    setAuditReport(auditData);

    setTimeout(() => {
      setQuantumState(currentErrorRate > 4.5 ? "COLLAPSED" : "VERIFIED");
    }, 400);
  };

  const handleSendPulseMessage = async (e) => {
    e.preventDefault();
    if (!customMessage.trim()) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/signatures/transmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: customMessage,
          sender: "Alice",
          receiver: "Bob",
        }),
      });
      const data = await res.json();

      setErrorRate(data.qber);
      const fidelity = Number((100 - data.qber * 1.5).toFixed(1));
      const noise = Number((data.qber + 0.8).toFixed(1));
      const degradation = Number((data.qber * 0.9).toFixed(1));

      setTelemetry({
        entanglement: fidelity,
        noise: noise,
        degradation: degradation,
      });

      const verdictStr = data.verdict === "REJECT" ? "INTERCEPTED" : "SECURE";
      setThreatLevel(verdictStr);

      const hasError = data.qber > 4.5 || data.verdict === "REJECT";
      const packetIndex = historyData.length + 1;
      setHistoryData((prev) => [
        ...prev.slice(-49),
        { index: packetIndex, errorRate: data.qber, hasError },
      ]);

      setAuditReport({
        timestamp: new Date().toLocaleString(),
        avgEntanglement: fidelity,
        maxError: data.qber,
        finalStatus: verdictStr,
        totalPackets: 1,
        conclusion:
          data.verdict === "REJECT"
            ? "REJECTED: Tampering detected."
            : "PASSED: Verified.",
      });

      setPulseResult({
        message: customMessage,
        timestamp: new Date().toLocaleTimeString(),
        status: `Sent securely. Backend Verdict: ${data.verdict} (QBER: ${data.qber.toFixed(2)}%)`,
      });
    } catch (err) {
      executeTransmissionCycle();
      setPulseResult({
        message: customMessage,
        timestamp: new Date().toLocaleTimeString(),
        status: "Local Simulation Pulse Verified Successfully!",
      });
    }
    setCustomMessage("");
  };

  const handleInjectNoise = async () => {
    try {
      await fetch("http://127.0.0.1:8000/noise/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          t1_enabled: true,
          t1_us: 100.0,
          t2_enabled: true,
          t2_us: 100.0,
          gate_time_ns: 100.0,
          depolarizing_enabled: true,
          two_qubit_depolarizing_prob: (sliderNoise / 0.75) / 100.0
        }),
      });
      await fetch("http://127.0.0.1:8000/noise/execute", { method: "POST" });
    } catch (err) {
      console.error("Failed to inject noise:", err);
    }
  };

  const handleInjectAttack = async () => {
    try {
      await fetch("http://127.0.0.1:8000/attacks/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attack_type: selectedAttack,
          intercept_rate: attackRate / 100.0
        }),
      });
      await fetch("http://127.0.0.1:8000/attacks/execute", { method: "POST" });
    } catch (err) {
      console.error("Failed to inject attack:", err);
    }
  };

  const toggleLiveTelemetryStream = async () => {
    if (isLiveActive) {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      setIsLiveActive(false);
      try {
        await fetch("http://127.0.0.1:8000/stream/stop", { method: "POST" });
      } catch (err) {}
    } else {
      setIsLiveActive(true);
      setLiveAttackAlert(null);
      setLivePayloads([]);
      setTeleportStep(1);
      setHistoryData([]);
      setTransmissionLogs([]);
      
      // Reset noise to 0% per user request
      setSliderNoise(0);
      try {
        await fetch("http://127.0.0.1:8000/noise/configure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            t1_enabled: true,
            t1_us: 100.0,
            t2_enabled: true,
            t2_us: 100.0,
            gate_time_ns: 100.0,
            depolarizing_enabled: true,
            two_qubit_depolarizing_prob: 0.0
          }),
        });
        await fetch("http://127.0.0.1:8000/noise/execute", { method: "POST" });
      } catch (err) {
        console.error("Failed to reset noise:", err);
      }
      
      executeTransmissionCycle();

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        if (streamTimerRef.current) clearInterval(streamTimerRef.current);
        if (stageTimerRef.current) clearInterval(stageTimerRef.current);

        streamTimerRef.current = setInterval(() => {
          executeTransmissionCycle();
        }, 2000);

        stageTimerRef.current = setInterval(() => {
          setTeleportStep((prev) => (prev >= 5 ? 1 : prev + 1));
        }, 500);
      }

      try {
        await fetch("http://127.0.0.1:8000/stream/start", { method: "POST" });
      } catch (err) {}
    }
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
      <aside className="w-full md:w-64 bg-[#0b0e17] border-r border-slate-800/80 p-6 flex flex-col justify-between shrink-0 space-y-4 shadow-2xl h-full overflow-hidden">
        <div className="space-y-6">
          <div className="space-y-3">
            <button
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab("home");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="text-xs uppercase tracking-wider text-indigo-400 hover:text-white transition-colors cursor-pointer font-semibold"
            >
              &larr; Back to Home
            </button>
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">
                Architecture
              </span>
              <h2 className="text-base font-serif text-white tracking-tight">
                QDS Protocol
              </h2>
            </div>
          </div>

          <nav className="space-y-2 text-sm">
            <button
              onClick={() => setActiveNav("telemetry")}
              className={`w-full text-left px-4 py-3 rounded-md transition-all cursor-pointer font-medium ${
                activeNav === "telemetry"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveNav("logs")}
              className={`w-full text-left px-4 py-3 rounded-md transition-all cursor-pointer font-medium ${
                activeNav === "logs"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Archive Log
            </button>
          </nav>

          <div className="p-4 rounded-md bg-[#07090e] border border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                Noise
              </span>
              <span className="text-indigo-400 font-mono font-bold">
                {sliderNoise}%
              </span>
            </div>
            <div className="">
              <input
                type="range"
                min="0"
                max="50"
                value={sliderNoise}
                onChange={(e) => setSliderNoise(Number(e.target.value))}
                className="accent-indigo-500 cursor-pointer h-4 bg-slate-800 rounded"
              />
              <button
                onClick={handleInjectNoise}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono uppercase tracking-wider px-2 py-2 rounded transition-all cursor-pointer font-bold whitespace-nowrap shadow"
              >
                Inject Noise
              </button>
            </div>
          </div>

          <div className="p-4 rounded-md bg-[#07090e] border border-slate-800 space-y-2">
            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block">
              Threat Injection
            </span>
            <select
              value={selectedAttack}
              onChange={(e) => setSelectedAttack(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b0e17] border border-slate-800 rounded-sm text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="FORGERY" title="Fails — no-cloning prevents copying an unknown state; QBER spikes">Signature Forgery</option>
              <option value="IMPERSONATION" title="Fails at the handshake stage — no valid basis/key agreement is reached">Impersonation</option>
              <option value="REPLAY" title="Caught classically by per-signer sequence-number check">Replay Attack</option>
              <option value="INTERCEPT_RESEND" title="Introduces detectable error into the reconstructed state; QBER rises">Channel Tampering</option>
            </select>
            
            <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                Interception Rate
              </span>
              <span className="text-rose-400 font-mono font-bold">
                {attackRate}%
              </span>
            </div>
            <div>
              <input
                type="range"
                min="0"
                max="50"
                value={attackRate}
                onChange={(e) => setAttackRate(Number(e.target.value))}
                className="accent-rose-500 cursor-pointer h-4 bg-slate-800 rounded-sm w-full"
              />
              <button
                onClick={handleInjectAttack}
                className="w-full mt-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono uppercase tracking-wider px-2 py-2 rounded-sm transition-all cursor-pointer font-bold whitespace-nowrap shadow"
              >
                Inject Threat
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-md bg-[#07090e] border border-slate-800 space-y-1 mt-auto">
          <span className="text-xs text-slate-400 block">Stream Status</span>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-sm-full ${isLiveActive ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`}
            />
            {isLiveActive ? "Active" : "Idle"}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 space-y-6 bg-[#07090e] flex flex-col justify-between overflow-y-auto h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 shrink-0">
          <div>
            <span className="text-xs text-indigo-400 font-semibold block mb-1">
              Execution Node
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-white">
              Quantum Control Room
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPulseModalOpen(true)}
              disabled={isLiveActive}
              className="bg-[#0b0e17] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs px-5 py-3 rounded-md transition-all cursor-pointer disabled:opacity-30 font-medium shadow"
            >
              Test Single Pulse
            </button>

            <button
              onClick={toggleLiveTelemetryStream}
              className={`text-xs px-6 py-3 rounded-md transition-all cursor-pointer font-bold shadow-lg ${
                isLiveActive
                  ? "bg-amber-500 text-slate-950 animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950"
              }`}
            >
              {isLiveActive ? "Halt Stream" : "Initialize Stream"}
            </button>
            <button
              onClick={() => setIsLiveModalOpen(true)}
              className="px-6 py-2 rounded-md text-xs font-bold transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 shadow-md"
            >
              View Live Transmission
            </button>
          </div>
        </div>

        {activeNav === "telemetry" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0b0e17] border border-slate-800 rounded-lg p-4 space-y-2 shadow-lg">
                <span className="text-xs text-slate-400 block font-medium">
                  Entanglement Purity
                </span>
                <div className="text-2xl font-serif text-white tracking-tight font-bold">
                  {Number(telemetry.entanglement).toFixed(2)}%
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-sm-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${telemetry.entanglement}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#0b0e17] border border-slate-800 rounded-lg p-4 space-y-2 shadow-lg">
                <span className="text-xs text-slate-400 block font-medium">
                  Channel Noise
                </span>
                <div className="text-2xl font-serif text-white tracking-tight font-bold">
                  {Number(telemetry.noise).toFixed(2)}%
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-sm-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-slate-400 h-full transition-all duration-300"
                    style={{ width: `${telemetry.noise * 2}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#0b0e17] border border-slate-800 rounded-lg p-4 space-y-2 shadow-lg">
                <span className="text-xs text-slate-400 block font-medium">
                  Degradation Factor
                </span>
                <div className="text-2xl font-serif text-white tracking-tight font-bold">
                  {Number(telemetry.degradation).toFixed(2)}%
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-sm-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-slate-400 h-full transition-all duration-300"
                    style={{ width: `${telemetry.degradation * 1.33}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#0b0e17] border border-slate-800/80 rounded-lg p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-serif font-bold text-white tracking-tight">
                  LIVE QBER TELEMETRY
                </h3>
              </div>

              <div className="w-full h-80 bg-[#07090e] border border-slate-800 rounded-md p-4 flex flex-row shadow-inner">
                {/* Y-axis Labels */}
                <div className="flex flex-col justify-between items-end h-full py-2 pr-4 w-12 border-r border-slate-800 shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">100%</span>
                  <span className="text-[10px] text-slate-500 font-mono">75%</span>
                  <span className="text-[10px] text-slate-500 font-mono">50%</span>
                  <span className="text-[10px] text-slate-500 font-mono">25%</span>
                  <span className="text-[10px] text-slate-500 font-mono">0%</span>
                </div>
                
                {/* SVG Chart Area */}
                <div className="flex-1 relative h-full py-2 pl-4">
                  {historyData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono italic">
                      Waiting for telemetry feed... Initialize stream to plot live QBER.
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      {(() => {
                        const fidPoints = historyData.map((pt, i, arr) => ({
                          x: arr.length === 1 ? 50 : (i / (arr.length - 1)) * 100,
                          y: Math.max(0, Math.min(100, 100 - (pt.fidelity || 100)))
                        }));
                        const noisePoints = historyData.map((pt, i, arr) => ({
                          x: arr.length === 1 ? 50 : (i / (arr.length - 1)) * 100,
                          y: Math.max(0, Math.min(100, 100 - pt.errorRate))
                        }));

                        const generateSmoothPath = (points) => {
                          if (points.length === 0) return "";
                          if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
                          let d = `M ${points[0].x},${points[0].y}`;
                          for (let i = 1; i < points.length; i++) {
                            const prev = points[i - 1];
                            const curr = points[i];
                            const cx = (prev.x + curr.x) / 2;
                            d += ` C ${cx},${prev.y} ${cx},${curr.y} ${curr.x},${curr.y}`;
                          }
                          return d;
                        };

                        return (
                          <div className="w-full h-full relative">
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible absolute inset-0">
                              {/* Grid Lines */}
                              <line x1="0" y1="0" x2="100" y2="0" stroke="#1e293b" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
                              <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
                              <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
                              <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
                              <line x1="0" y1="100" x2="100" y2="100" stroke="#1e293b" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
                              
                              {/* Fidelity Line (Purple) */}
                              <g 
                                className="cursor-pointer"
                                onMouseMove={(e) => setLineTooltip({ text: 'Correctness', x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
                                onMouseLeave={() => setLineTooltip(null)}
                              >
                                {/* Invisible Fat Hitbox */}
                                <path
                                  fill="none"
                                  stroke="transparent"
                                  strokeWidth="10"
                                  vectorEffect="non-scaling-stroke"
                                  d={generateSmoothPath(fidPoints)}
                                />
                                {/* Visible Line */}
                                <path
                                  fill="none"
                                  stroke="#6366f1"
                                  strokeWidth="2"
                                  vectorEffect="non-scaling-stroke"
                                  className="drop-shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all"
                                  d={generateSmoothPath(fidPoints)}
                                />
                              </g>
                              
                              {/* Noise Line (Gray) */}
                              <g 
                                className="cursor-pointer"
                                onMouseMove={(e) => setLineTooltip({ text: 'Noise', x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
                                onMouseLeave={() => setLineTooltip(null)}
                              >
                                {/* Invisible Fat Hitbox */}
                                <path
                                  fill="none"
                                  stroke="transparent"
                                  strokeWidth="10"
                                  vectorEffect="non-scaling-stroke"
                                  d={generateSmoothPath(noisePoints)}
                                />
                                {/* Visible Line */}
                                <path
                                  fill="none"
                                  stroke="#94a3b8"
                                  strokeWidth="2"
                                  vectorEffect="non-scaling-stroke"
                                  className="drop-shadow-[0_0_8px_rgba(148,163,184,0.4)] transition-all"
                                  d={generateSmoothPath(noisePoints)}
                                />
                              </g>
                            </svg>
                            {lineTooltip && (
                              <div 
                                className="absolute bg-[#0b0e17] border border-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded-sm shadow-xl pointer-events-none whitespace-nowrap z-50 font-sans font-medium"
                                style={{ left: lineTooltip.x, top: lineTooltip.y - 25, transform: 'translateX(-50%)' }}
                              >
                                {lineTooltip.text}
                              </div>
                            )}

                            {/* HTML Data Point Circles (Perfectly Circular & Interactive) */}
                            {historyData.map((pt, i, arr) => {
                              const x = arr.length === 1 ? 50 : (i / (arr.length - 1)) * 100;
                              const yFid = Math.max(0, Math.min(100, 100 - (pt.fidelity || 100)));
                              const yNoise = Math.max(0, Math.min(100, 100 - pt.errorRate));
                              return (
                                <div key={pt.index}>
                                  {/* Fidelity Dot */}
                                  <div 
                                    className="absolute w-2 h-2 rounded-sm-full bg-indigo-400 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer hover:scale-150 transition-all hover:bg-indigo-300 hover:shadow-[0_0_8px_rgba(129,140,248,1)] z-20"
                                    style={{ left: `${x}%`, top: `${yFid}%` }}
                                  >
                                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-[#0b0e17] border border-slate-700 text-indigo-300 text-[10px] px-2 py-0.5 rounded-sm shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap font-sans font-medium">
                                      Purity: {Number(pt.fidelity || 100).toFixed(2)}%
                                    </div>
                                  </div>
                                  
                                  {/* Noise Dot */}
                                  <div 
                                    className="absolute w-2 h-2 rounded-sm-full bg-slate-400 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer hover:scale-150 transition-all hover:bg-slate-200 hover:shadow-[0_0_8px_rgba(203,213,225,1)] z-20"
                                    style={{ left: `${x}%`, top: `${yNoise}%` }}
                                  >
                                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-[#0b0e17] border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-sm shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap font-sans font-medium">
                                      QBER rate: {Number(pt.errorRate).toFixed(2)}%{pt.attackName ? ` [${pt.attackName}]` : ""}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#0b0e17] border border-slate-800 rounded-lg p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs text-indigo-400 block font-medium">
                    Quantum Teleportation
                  </span>
                  <h3 className="text-sm font-serif text-white tracking-tight">
                    Alice &rarr; Quantum Channel &rarr; Bob
                  </h3>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Stage{" "}
                  <span className="text-indigo-400 font-bold">
                    {teleportStep}
                  </span>{" "}
                  of 5
                </div>
              </div>

              <div className="flex items-center justify-between px-8 py-4 bg-[#07090e] border border-slate-800 rounded-md text-xs shadow-inner">
                <div className="flex flex-col items-center space-y-1.5">
                  <div
                    className={`w-12 h-12 rounded-md border-2 flex items-center justify-center font-bold text-sm transition-all ${teleportStep >= 1 ? "border-indigo-500 text-indigo-300 bg-indigo-950/60 shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "border-slate-800 text-slate-600 bg-slate-900"}`}
                  >
                    A
                  </div>
                  <span className="text-xs text-white font-semibold uppercase">
                    Alice
                  </span>
                  <span className="text-[10px] text-indigo-400">Signer</span>
                </div>

                <div className="flex-1 px-8 flex flex-col items-center space-y-2 text-center">
                  <span
                    className={`text-[11px] font-medium transition-colors ${teleportStep >= 2 ? "text-indigo-300 animate-pulse" : "text-slate-600"}`}
                  >
                    --- Quantum State (Bell Pair) ---
                  </span>
                  <div className="w-full border-t border-dashed border-indigo-500/40 my-1" />
                  <span
                    className={`text-[11px] font-medium transition-colors ${teleportStep >= 4 ? "text-indigo-300 animate-pulse" : "text-slate-600"}`}
                  >
                    --- Classical Correction Bits ---
                  </span>
                </div>

                <div className="flex flex-col items-center space-y-1.5">
                  <div
                    className={`w-12 h-12 rounded-md border-2 flex items-center justify-center font-bold text-sm transition-all ${teleportStep >= 5 ? "border-emerald-400 text-emerald-300 bg-emerald-950/60 shadow-[0_0_15px_rgba(52,211,153,0.5)]" : "border-slate-800 text-slate-600 bg-slate-900"}`}
                  >
                    B
                  </div>
                  <span className="text-xs text-white font-semibold uppercase">
                    Bob
                  </span>
                  <span className="text-[10px] text-emerald-400">Verifier</span>
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
                      className={`p-4 rounded-md border transition-all cursor-pointer space-y-1.5 shadow ${
                        isActive
                          ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500"
                          : "bg-[#07090e] border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold block ${isActive ? "text-indigo-400" : "text-slate-500"}`}
                      >
                        {st.badge}
                      </span>
                      <h4 className="text-xs font-serif text-white font-medium">
                        {st.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-light leading-snug">
                        {st.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {auditReport ? (
              <div className="bg-[#0b0e17] border border-indigo-500/40 rounded-lg p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-serif text-white font-semibold">
                    Comprehensive Audit Verdict
                  </h3>
                  <span className="text-xs text-indigo-400 font-semibold">
                    {auditReport.timestamp}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-md bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Avg Entanglement
                    </span>
                    <span className="text-white font-bold text-sm">
                      {auditReport.avgEntanglement}%
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Max Error Rate
                    </span>
                    <span className="text-white font-bold text-sm">
                      {auditReport.maxError}%
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Total Packets
                    </span>
                    <span className="text-white font-bold text-sm">
                      {auditReport.totalPackets}
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Final Verdict
                    </span>
                    <span className="text-indigo-400 font-bold text-sm">
                      {auditReport.finalStatus}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0b0e17] border border-slate-800 rounded-lg p-6 text-center text-xs text-slate-500 shadow-xl">
                Comprehensive Audit Verdict will appear here after initializing
                a stream or sending a pulse.
              </div>
            )}
          </div>
        )}

        {activeNav === "logs" && (
          <div className="flex-1 flex items-center justify-center my-auto">
            <div className="bg-[#0b0e17] border border-slate-800 rounded-lg p-6 flex flex-col justify-between space-y-5 w-full max-w-2xl shadow-xl shrink-0">
              <div>
                <span className="text-xs text-indigo-400 font-semibold block">
                  Event Ledger
                </span>
                <h3 className="text-xl font-serif text-white">
                  Telemetry Log History
                </h3>
              </div>

              <div className="bg-[#07090e] border border-slate-800 rounded-md p-5 h-48 overflow-y-auto text-xs space-y-2.5 text-slate-300 shadow-inner">
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

      {isPulseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b0e17] border border-slate-800 rounded-xl p-8 w-full max-w-lg shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-sm-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs">
              <span className="text-indigo-400 font-bold">
                Send Test Message
              </span>
              <button
                onClick={() => {
                  setIsPulseModalOpen(false);
                  setPulseResult(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-white">
                Quantum Pulse Transmission
              </h2>
              <p className="text-xs text-slate-400 font-light">
                Type your message below to send it securely through the quantum
                channel.
              </p>
            </div>

            <form
              onSubmit={handleSendPulseMessage}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-medium text-[11px]">
                  Your Message
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type your secure message here..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-[#07090e] border border-slate-800 rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all shadow-inner resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-md transition-all cursor-pointer font-bold shadow-lg shadow-indigo-950"
              >
                Send Message &rarr;
              </button>
            </form>

            {pulseResult && (
              <div className="p-4 rounded-md bg-[#07090e] border border-emerald-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>{pulseResult.status}</span>
                  <span>{pulseResult.timestamp}</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500 block text-[11px]">
                    Sent Message:
                  </span>
                  &quot;{pulseResult.message}&quot;
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b0e17] border border-slate-800 rounded-xl p-8 w-full max-w-lg shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-sm-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs">
              <span className="text-emerald-400 font-bold">
                Live Data Stream
              </span>
              <button
                onClick={() => setIsLiveModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-white">
                Continuous Transmission Log
              </h2>
              <p className="text-xs text-slate-400 font-light">
                Monitoring secure payloads transmitted over the quantum fiber
                channel in real-time.
              </p>
            </div>

            {liveAttackAlert && (
              <div
                className={`w-full bg-[#07090e] border rounded-md p-4 flex flex-col items-center justify-center space-y-2 text-xs shadow-lg ${liveAttackAlert.reason === "ATTACK" ? "border-red-500/40 shadow-red-950/20" : "border-amber-500/40 shadow-amber-950/20"}`}
              >
                <span className="text-2xl mb-1">
                  {liveAttackAlert.reason === "ATTACK" ? "🚨" : "🌪️"}
                </span>
                <span
                  className={`font-bold ${liveAttackAlert.reason === "ATTACK" ? "text-red-500" : "text-amber-500"}`}
                >
                  TRANSMISSION HALTED
                </span>
                <span
                  className={
                    liveAttackAlert.reason === "ATTACK"
                      ? "text-red-300 text-center leading-relaxed"
                      : "text-amber-300 text-center leading-relaxed"
                  }
                >
                  {liveAttackAlert.reason === "ATTACK" ? (
                    <>
                      Eavesdropper Interception Detected. Wavefunction Collapsed.
                      {liveAttackAlert.metrics && (
                        <span className="font-mono text-[10px] text-red-400 opacity-90 block mt-1">
                          STATISTICAL ENGINE: Probability of Forgery: p &lt; {Number(liveAttackAlert.metrics.p_value).toExponential(2)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      Excessive Environmental Decoherence.
                      {liveAttackAlert.metrics && (
                        <span className="font-mono text-[10px] text-amber-400 opacity-90 block mt-1">
                          STATISTICAL ENGINE: QBER exceeded dynamic Hoeffding bound ({Number(liveAttackAlert.metrics.dynamic_threshold).toFixed(1)}%).
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
            )}

            <div className="w-full bg-[#07090e] border border-slate-800 rounded-md p-4 h-64 overflow-y-auto space-y-3 shadow-inner">
              {livePayloads.length === 0 ? (
                <div className="text-xs text-slate-500 text-center mt-20">
                  Waiting for stream to begin...
                </div>
              ) : (
                livePayloads.map((pl, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col space-y-1 pb-3 border-b border-slate-800/50 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span
                        className={`${pl.status === "DELIVERED" ? "text-emerald-400" : pl.status.startsWith("INTERCEPTED") ? "text-red-400" : "text-amber-400 animate-pulse"}`}
                      >
                        {pl.status}
                      </span>
                      <span className="text-slate-500">{pl.timestamp}</span>
                    </div>
                    <div className="text-xs text-slate-300 break-words leading-relaxed">
                      &quot;{pl.text}&quot;
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
