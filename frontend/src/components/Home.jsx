import React, { useEffect, useRef, useState } from "react";
import Footer from "./Footer";

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrame;
    let particles = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(
        80,
        Math.max(35, Math.floor((width * height) / 18000)),
      );

      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        size: Math.random() * 1.6 + 0.5,
        opacity: Math.random() * 0.45 + 0.15,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
      }

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129, 140, 248, ${p1.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(129, 140, 248, 0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 130) {
            const opacity = (1 - distance / 130) * 0.18;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
    />
  );
}

export default function Home({ setActiveTab }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [integrity, setIntegrity] = useState(0);
  const [confidence, setConfidence] = useState(0);

  const features = [
    {
      tag: "01",
      title: "BELL-STATE ENTANGLEMENT",
      desc: "Creates shared quantum states between trusted endpoints before signature verification begins.",
    },
    {
      tag: "02",
      title: "PAULI BASIS CORRECTION",
      desc: "Applies controlled basis transformations to preserve state integrity during quantum transmission.",
    },
    {
      tag: "03",
      title: "INFORMATION-THEORETIC SECURITY",
      desc: "Uses quantum information principles to establish security guarantees independent of computational assumptions.",
    },
    {
      tag: "04",
      title: "NO-CLONING DETECTION",
      desc: "Detects anomalous state duplication and identifies potential interference inside the transmission channel.",
    },
    {
      tag: "05",
      title: "DETERMINISTIC VERIFICATION",
      desc: "Performs deterministic signature validation before accepting the transmitted quantum-secured message.",
    },
  ];

  const faqs = [
    {
      question: "What is QDS.Engine?",
      answer:
        "QDS.Engine is a quantum-oriented digital signature and security framework designed around entanglement, state verification, threat detection, and deterministic authentication.",
    },
    {
      question: "How does the quantum security pipeline work?",
      answer:
        "The security pipeline establishes an entangled state, performs basis correction, applies information-theoretic security validation, monitors for cloning or interference, and finally performs deterministic verification.",
    },
    {
      question: "What does zero-trust mean in this architecture?",
      answer:
        "Zero-trust means that no endpoint, state, or transmission is automatically trusted. Each stage must independently satisfy the required verification conditions before the next stage can proceed.",
    },
    {
      question: "How is a compromised quantum state detected?",
      answer:
        "The threat detection layer continuously evaluates the transmitted state for unexpected changes, duplication indicators, or interference patterns that violate the expected security model.",
    },
    {
      question: "Can the simulator be used for testing?",
      answer:
        "Yes. The simulator provides a controlled environment for observing protocol behavior, security telemetry, verification states, and threat detection events.",
    },
    {
      question: "Is this intended to replace conventional cryptography?",
      answer:
        "The platform is designed as a quantum security research and simulation framework. Its purpose is to explore quantum-oriented authentication and verification concepts rather than automatically replace established cryptographic systems.",
    },
  ];

  useEffect(() => {
    let integrityFrame;
    let confidenceFrame;
    const start = performance.now();

    const animateIntegrity = (time) => {
      const progress = Math.min((time - start) / 1200, 1);
      setIntegrity((99.8 * progress).toFixed(1));
      if (progress < 1)
        integrityFrame = requestAnimationFrame(animateIntegrity);
    };

    const confidenceStart = performance.now();
    const animateConfidence = (time) => {
      const progress = Math.min((time - confidenceStart) / 1400, 1);
      setConfidence(Math.floor(92 * progress));
      if (progress < 1)
        confidenceFrame = requestAnimationFrame(animateConfidence);
    };

    integrityFrame = requestAnimationFrame(animateIntegrity);
    confidenceFrame = requestAnimationFrame(animateConfidence);

    return () => {
      cancelAnimationFrame(integrityFrame);
      cancelAnimationFrame(confidenceFrame);
    };
  }, []);

  const launchSimulator = () => {
    if (setActiveTab) {
      setActiveTab("simulator");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPipeline = () => {
    const element = document.getElementById("pipeline");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.85); opacity: 0.7; }
          70% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .pulse-ring { animation: pulseRing 3s ease-out infinite; }
        .rotate-slow { animation: rotateSlow 20s linear infinite; }
        .rotate-reverse { animation: rotateReverse 15s linear infinite; }
        .faq-content {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 400ms ease-in-out;
        }
        .faq-content.open { grid-template-rows: 1fr; }
        .faq-inner { overflow: hidden; }
      `}</style>

      <main className="w-full bg-[#07090e] text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500/30 flex flex-col pt-20">
        <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden border-b border-slate-800/80 px-8 sm:px-12 lg:px-20 py-20">
          <div className="absolute inset-0 pointer-events-none">
            <ParticleBackground />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.07),transparent_65%)]" />
          </div>

          <div className="relative z-10 w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif tracking-tight text-white leading-[1.08]">
                Absolute security backed by quantum mechanics, not complexity.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-xl">
                A high-performance cryptographic simulation framework engineered
                around Bell-state entanglement, real-time wave function
                collapse, and zero-trust verification engines.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs">
                <button
                  onClick={launchSimulator}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950 font-semibold"
                >
                  Launch Simulator &rarr;
                </button>

                <button
                  onClick={goToPipeline}
                  className="bg-[#0b0e17] border border-slate-700 text-slate-200 hover:text-white uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all cursor-pointer font-semibold hover:border-slate-500"
                >
                  Explore Architecture
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-[#0b0e17]/90 border border-slate-700/80">
                  <span className="text-slate-400 uppercase text-[10px] block mb-1">
                    Protocol
                  </span>
                  <span className="text-white font-semibold">QDS / AQS</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0b0e17]/90 border border-slate-700/80">
                  <span className="text-slate-400 uppercase text-[10px] block mb-1">
                    Encryption
                  </span>
                  <span className="text-indigo-300 font-semibold">QUANTUM</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0b0e17]/90 border border-slate-700/80">
                  <span className="text-slate-400 uppercase text-[10px] block mb-1">
                    Detection
                  </span>
                  <span className="text-emerald-300 font-semibold">ACTIVE</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0b0e17]/90 border border-slate-700/80">
                  <span className="text-slate-400 uppercase text-[10px] block mb-1">
                    Trust Model
                  </span>
                  <span className="text-white font-semibold">ZERO-TRUST</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-[#0b0e17]/90 border border-slate-700 rounded-2xl p-7 space-y-5 shadow-xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono text-xs">
                  <span className="text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Core Telemetry
                  </span>
                  <span className="text-indigo-400 font-semibold text-xs">
                    [LIVE]
                  </span>
                </div>

                <div className="flex items-center justify-between p-5 rounded-xl bg-[#07090e] border border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                      System Integrity
                    </span>
                    <span className="text-3xl font-serif font-bold text-white">
                      {integrity}%
                    </span>
                  </div>
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-indigo-500/20" />
                    <div className="absolute inset-1 rounded-full border border-indigo-500/40 rotate-slow" />
                    <div className="absolute inset-2.5 rounded-full border border-emerald-400/40 rotate-reverse" />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,1)]" />
                    <div className="absolute inset-0 rounded-full border border-indigo-500/30 pulse-ring" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-slate-400 uppercase text-[10px]">
                      Entanglement
                    </span>
                    <span className="text-indigo-300 font-bold block text-xs">
                      STABLE
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-slate-400 uppercase text-[10px]">
                      No-Cloning
                    </span>
                    <span className="text-emerald-300 font-bold block text-xs">
                      ACTIVE
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-slate-400 uppercase text-[10px]">
                      Threat Level
                    </span>
                    <span className="text-white font-bold block text-xs">
                      NOMINAL
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#07090e] border border-slate-800 space-y-1">
                    <span className="text-slate-400 uppercase text-[10px]">
                      Response
                    </span>
                    <span className="text-indigo-300 font-bold block text-xs">
                      READY
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between font-mono text-xs text-slate-300">
                    <span>Verification Confidence</span>
                    <span className="text-indigo-400 font-bold">
                      {confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="pipeline"
          className="py-20 px-8 sm:px-12 lg:px-20 max-w-[1400px] mx-auto space-y-8 border-b border-slate-800/80 w-full"
        >
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold block">
              Protocol Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
              Engineered for absolute post-quantum resilience
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border bg-[#0b0e17] border-slate-700/90 flex flex-col justify-between min-h-[300px] shadow-lg hover:border-indigo-500/60 transition-all"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-400 block">
                    Stage {feat.tag}
                  </span>
                </div>

                <div className="py-4">
                  <h3 className="text-sm sm:text-base font-serif text-white font-semibold leading-snug">
                    {feat.title}
                  </h3>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-300 font-sans font-normal leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 px-8 sm:px-12 lg:px-20 max-w-[1400px] mx-auto space-y-8 border-b border-slate-800/80 w-full">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold block">
              Security Framework
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
              Built for Zero-Trust
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                number: "01",
                title: "Zero-Trust Architecture",
                text: "Every state, signature, and communication channel is independently verified before trust is established.",
              },
              {
                number: "02",
                title: "Real-Time Telemetry",
                text: "Security telemetry continuously evaluates the quantum channel for anomalies, interference, and compromised states.",
              },
              {
                number: "03",
                title: "Deterministic Validation",
                text: "Digital signatures are validated through a deterministic security pipeline before transmission is accepted.",
              },
            ].map((pillar, i) => (
              <div
                key={i}
                className="bg-[#0b0e17] border border-slate-700/90 rounded-2xl p-7 space-y-4 hover:border-slate-500 transition-all shadow-xl"
              >
                <span className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center font-mono text-xs font-bold text-indigo-300">
                  {pillar.number}
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-serif text-white font-semibold">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                    {pillar.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="py-20 px-8 sm:px-12 lg:px-20 max-w-[1000px] mx-auto space-y-8 border-b border-slate-800/80 w-full"
        >
          <div className="space-y-2 text-center max-w-xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold block">
              Knowledge Base
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen
                      ? "bg-[#0b0e17] border-indigo-500 shadow-xl"
                      : "bg-[#0b0e17] border-slate-700/90 hover:border-slate-500"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer font-serif text-sm sm:text-base text-white font-medium"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-6 h-6 rounded-lg bg-[#07090e] border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-indigo-300">
                        0{idx + 1}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    <span
                      className={`font-mono text-sm transition-transform duration-300 ${isOpen ? "rotate-90 text-indigo-400" : "text-slate-400"}`}
                    >
                      &rarr;
                    </span>
                  </button>

                  <div className={`faq-content ${isOpen ? "open" : ""}`}>
                    <div className="faq-inner">
                      <div className="px-5 pb-5 pt-2 border-t border-slate-800 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-20 px-8 sm:px-12 lg:px-20 max-w-[1400px] mx-auto w-full">
          <div className="bg-[#0b0e17] border border-slate-700/90 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold block">
                Secure Node Active
              </span>
              <h4 className="text-xl sm:text-2xl font-serif text-white font-semibold">
                Ready to test the telemetry engine?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-md">
                Initialize a live quantum transmission stream or test individual
                pulses in the advanced simulator interface.
              </p>
            </div>

            <button
              onClick={launchSimulator}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all cursor-pointer font-bold whitespace-nowrap shadow-lg shadow-indigo-950"
            >
              Open Simulator &rarr;
            </button>
          </div>
        </section>

        <Footer setActiveTab={setActiveTab} />
      </main>
    </>
  );
}
