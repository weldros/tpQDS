import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowUpRight,
  ChevronRight,
  Cpu,
  Lock,
  ShieldCheck,
  Terminal,
} from "lucide-react";

export default function Home({ setActiveTab, scrollToSection }) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeResearchMode, setActiveResearchMode] = useState(
    "Bell State Analysis",
  );
  const [openFaq, setOpenFaq] = useState(0);

  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const pulseBarRef = useRef(null);
  const displayCardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power3.out" },
      );

      gsap.to(catRef.current, {
        y: -10,
        repeat: -1,
        yoyo: true,
        duration: 3,
        ease: "sine.inOut",
      });

      gsap.fromTo(
        pulseBarRef.current,
        { scaleX: 0.2, opacity: 0.3 },
        {
          scaleX: 1,
          opacity: 1,
          repeat: -1,
          yoyo: true,
          duration: 1.8,
          ease: "power1.inOut",
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const catRef = useRef(null);

  const handleFeatureChange = (idx) => {
    if (activeFeature === idx) return;
    if (displayCardRef.current) {
      gsap.fromTo(
        displayCardRef.current,
        { opacity: 0, scale: 0.97, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power3.out" },
      );
    }
    setActiveFeature(idx);
  };

  const features = [
    {
      title: "Bell-State Entanglement Engine",
      desc: "Establishes secure, pre-shared quantum keys across distributed node endpoints for unbreakable authentication.",
      tag: "01",
    },
    {
      title: "Pauli Basis Correction",
      desc: "Evaluates incoming signature tokens via precise Pauli matrix transformations and projective measurements.",
      tag: "02",
    },
    {
      title: "Information-Theoretic Security",
      desc: "Mathematical protection backed by the laws of physics rather than computational hardness assumptions.",
      tag: "03",
    },
    {
      title: "No-Cloning Threat Detection",
      desc: "Instantly collapses superposition states upon unauthorized eavesdropping attempts, dropping compromised tokens.",
      tag: "04",
    },
    {
      title: "Deterministic Verification",
      desc: "Eliminates black-box uncertainties with strict statistical threshold rules and transparent decision logic.",
      tag: "05",
    },
  ];

  const faqs = [
    {
      q: "How does QDS-Secure protect against quantum attacks like Shor's Algorithm?",
      a: "Unlike classical RSA and ECC systems which rely on integer factorization vulnerabilities, QDS-Secure is built entirely on quantum mechanical principles, making it fundamentally immune to Shor's algorithm.",
    },
    {
      q: "Do I need dedicated quantum hardware to run the simulation?",
      a: "No, our research software framework simulates quantum public key distribution, Bell-state channels, and state collapses locally or across distributed network environments.",
    },
    {
      q: "What makes this different from machine learning threat detectors?",
      a: "Our framework relies strictly on deterministic quantum physics and information-theoretic bounds rather than heuristic models, ensuring zero false-positive blind spots.",
    },
    {
      q: "Who is this cryptographic framework engineered for?",
      a: "It is built for quantum cryptographers, academic researchers, and defense or government infrastructure architects requiring absolute communication integrity.",
    },
    {
      q: "How do I access the interactive simulator testbed?",
      a: "You can instantly launch our interactive verification sandbox by clicking the control suite access button in the navigation bar or hero section.",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="w-full space-y-28 pb-32 bg-neutral-950 text-neutral-100 overflow-hidden"
    >
      <section ref={heroRef} className="pt-8 px-6 max-w-7xl mx-auto">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-14 relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-gradient-to-b from-sky-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Glowing neon pulse bar only (top text metadata removed) */}
          <div className="flex flex-col w-full max-w-4xl mb-6 relative">
            <div className="w-full h-[2px] bg-neutral-800 relative overflow-hidden rounded-full">
              <div
                ref={pulseBarRef}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent origin-left"
              />
            </div>
          </div>

          <div className="max-w-4xl space-y-6 relative z-10 my-4">
            <h1 className="text-4xl sm:text-7xl font-serif tracking-tight text-white leading-[1.05]">
              Entangle. Verify. <br />
              <span className="text-amber-500">[&rarr;] Collapse.</span>
            </h1>

            <p className="text-neutral-400 font-light text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Information-theoretic security over dedicated Bell-state quantum
              teleportation channels with absolute deterministic resilience.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setActiveTab("simulator")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-neutral-950 text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-full hover:opacity-95 transition-all font-mono shadow-md cursor-pointer transform hover:scale-105"
              >
                Run Quantum Simulator <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("pipeline");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-semibold uppercase tracking-wider px-7 py-3.5 rounded-full hover:border-amber-500 transition-all font-mono shadow-xs cursor-pointer"
              >
                Explore Architecture
              </button>
            </div>
          </div>

          <div className="w-full max-w-4xl mt-12 grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative z-10 text-left">
            <div className="md:col-span-4 bg-neutral-950 border border-neutral-800 p-5 rounded-2xl space-y-4 font-mono text-xs shadow-lg">
              <span className="text-[10px] uppercase text-neutral-500 block">
                Featured Insight
              </span>
              <div className="space-y-3">
                <div className="group cursor-pointer hover:text-amber-400 transition-colors">
                  <span className="text-white font-bold block mb-1">
                    Quantum Key Distribution &rarr;
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Bell-state parameters over fiber channels.
                  </span>
                </div>
                <div className="group cursor-pointer hover:text-amber-400 transition-colors pt-2 border-t border-neutral-900">
                  <span className="text-white font-bold block mb-1">
                    No-Cloning Protection &rarr;
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Detecting eavesdroppers instantly.
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent rounded-2xl filter blur-xl pointer-events-none" />
              <div
                ref={catRef}
                className="relative z-10 w-48 sm:w-60 aspect-[1/1] bg-neutral-950 border border-amber-500/40 rounded-2xl overflow-hidden flex flex-col items-center justify-center shadow-2xl p-4 text-center"
              >
                <div className="w-20 h-10 bg-amber-500/20 border border-amber-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                </div>
                <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
                  Cyber_Cat v2.4
                </span>
                <span className="text-[9px] font-mono text-amber-500 mt-1">
                  Optic Telemetry Active
                </span>
              </div>
            </div>

            <div className="md:col-span-4 bg-neutral-950 border border-neutral-800 p-5 rounded-2xl space-y-2 font-mono text-xs shadow-lg">
              <span className="text-[10px] uppercase text-neutral-500 block">
                System Defense
              </span>
              <p className="text-xs text-neutral-300 font-light leading-relaxed">
                With information-theoretic security that safeguards
                cryptographic signatures around the clock.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pipeline" className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
            Execution Pipeline
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight">
            Engineered for absolute post-quantum cryptographic resilience and
            threat mitigation
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="lg:col-span-5 space-y-4">
            {features.map((feat, idx) => (
              <div
                key={idx}
                onClick={() => handleFeatureChange(idx)}
                className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 border ${activeFeature === idx ? "bg-neutral-950 border-amber-500/50 shadow-xs translate-x-2" : "bg-transparent border-transparent hover:bg-neutral-950/50 hover:translate-x-1"}`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-amber-500 font-bold">
                    {feat.tag}
                  </span>
                  <h3 className="text-base font-serif text-white">
                    {feat.title}
                  </h3>
                </div>
                {activeFeature === idx && (
                  <p className="text-xs text-neutral-400 font-light leading-relaxed pl-7 transition-opacity duration-300">
                    {feat.desc}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div
            ref={displayCardRef}
            className="lg:col-span-7 bg-neutral-950 border border-neutral-800 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden transition-all duration-500"
          >
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
            <div className="text-center space-y-3 relative z-10 max-w-sm transition-all duration-300 transform scale-100">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-neutral-950 font-mono text-xl font-bold shadow-md">
                Ψ⁺
              </div>
              <h4 className="text-lg font-serif text-white">
                {features[activeFeature].title}
              </h4>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                {features[activeFeature].desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
            Workflow Methodology
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight">
            How the quantum digital signature verification engine operates
            securely
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-sm flex flex-col justify-between transition-transform duration-300 hover:-translate-y-2">
            <div className="space-y-4">
              <span className="text-xs font-mono text-amber-500 font-bold">
                STEP 01
              </span>
              <h3 className="text-xl font-serif text-white">
                Entanglement distribution
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                Shared Bell pairs are established across sender and receiver
                node endpoints, setting up secure communication channels prior
                to any signature token transfer.
              </p>
            </div>
            <div className="pt-4 border-t border-neutral-800 flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-950/40 p-3 rounded-xl border border-amber-900/50">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Bell state
              pair generation
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-sm flex flex-col justify-between transition-transform duration-300 hover:-translate-y-2">
            <div className="space-y-4">
              <span className="text-xs font-mono text-amber-500 font-bold">
                STEP 02
              </span>
              <h3 className="text-xl font-serif text-white">
                Projective measurement audit
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                Incoming signature tokens are evaluated using precise Pauli
                basis transformations and projective measurements to check for
                statistical threshold compliance.
              </p>
            </div>
            <div className="pt-4 border-t border-neutral-800 flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pauli
              basis verification
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-sm flex flex-col justify-between transition-transform duration-300 hover:-translate-y-2">
            <div className="space-y-4">
              <span className="text-xs font-mono text-amber-500 font-bold">
                STEP 03
              </span>
              <h3 className="text-xl font-serif text-white">
                Deterministic threat response
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                Any eavesdropping or channel tampering immediately collapses the
                superposition state via the no-cloning theorem, allowing instant
                and automated rejection.
              </p>
            </div>
            <div className="pt-4 border-t border-neutral-800 flex items-center gap-2 text-xs font-mono text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Instant
              state collapse
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
            03 // RESEARCH ENVIRONMENT
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight">
            Academic Validation & Protocol Testing
          </h2>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="lg:col-span-7 space-y-6 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                "Bell State Analysis",
                "Pauli Matrix Auditing",
                "No-Cloning Simulation",
              ].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveResearchMode(mode)}
                  className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer font-mono ${
                    activeResearchMode === mode
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-sm"
                      : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-6 space-y-3 text-xs font-mono text-neutral-300">
              <div className="flex items-center gap-2 text-amber-500 font-bold pb-2 border-b border-neutral-900">
                <Cpu className="w-4 h-4" /> Active Subsystem Module:{" "}
                {activeResearchMode}
              </div>
              <p className="text-neutral-400 font-sans font-light leading-relaxed">
                Evaluating information-theoretic bounds across simulated quantum
                channels. Designed exclusively for academic verification, peer
                review, and post-quantum cryptographic hardening.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-2xl p-8 flex flex-col justify-between space-y-6 text-center relative z-10">
            <div className="space-y-3">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest block font-mono">
                Academic Access Status
              </span>
              <div className="text-xl font-serif text-white">
                Open Access Protocol
              </div>
              <div className="inline-block">
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-800/80 font-mono tracking-wide">
                  Fully Auditable Source
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("simulator")}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-neutral-950 font-bold text-xs font-mono uppercase tracking-wider py-4 rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
            >
              Launch Simulator <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
            Common Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
            Everything you need to know about the Quantum Digital Signature
            framework
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between font-serif text-lg text-white hover:bg-neutral-800/50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <span
                  className={`transform transition-transform duration-300 ${openFaq === idx ? "rotate-90 text-amber-500" : "text-neutral-500"}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </span>
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-6 text-xs text-neutral-400 font-light leading-relaxed border-t border-neutral-800 pt-4 transition-all">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
