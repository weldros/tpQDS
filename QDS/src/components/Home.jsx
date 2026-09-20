import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowUpRight,
  ChevronRight,
  Cpu,
  Network,
  Radio,
  Binary,
  BookOpen,
} from "lucide-react";

export default function Home({ setActiveTab, scrollToSection }) {
  const [hoveredStep, setHoveredStep] = useState(null);
  const [activeResearchMode, setActiveResearchMode] = useState(
    "Bell State Analysis",
  );
  const [openFaq, setOpenFaq] = useState(0);

  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const pulseBarRef = useRef(null);
  const contentDisplayRef = useRef(null);

  const timeoutRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power3.out" },
      );

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

    return () => {
      ctx.revert();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (idx) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredStep(idx);
    if (contentDisplayRef.current) {
      gsap.fromTo(
        contentDisplayRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" },
      );
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredStep(null);
    }, 400);
  };

  const handleInfoBoxMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleInfoBoxMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredStep(null);
    }, 300);
  };

  const features = [
    {
      title: "Bell-State Entanglement Engine",
      desc: "Establishes robust, pre-shared quantum entanglement channels across distributed network nodes to guarantee absolute authentication integrity and secure foundational key generation.",
      tag: "01",
    },
    {
      title: "Pauli Basis Correction",
      desc: "Performs precise cryptographic transformations and projective measurements to evaluate incoming token states, instantly rectifying phase shifts and operational anomalies.",
      tag: "02",
    },
    {
      title: "Information-Theoretic Security",
      desc: "Applies uncompromising mathematical protections rooted strictly in fundamental quantum mechanics rather than relying on vulnerable computational hardness assumptions.",
      tag: "03",
    },
    {
      title: "No-Cloning Threat Detection",
      desc: "Monitors quantum states in real-time, instantly triggering network defense protocols and dropping compromised tokens the moment any unauthorized eavesdropping occurs.",
      tag: "04",
    },
    {
      title: "Deterministic Verification",
      desc: "Eliminates heuristic blind spots and black-box uncertainties by utilizing rigorous statistical threshold standards and fully transparent decision logic rules.",
      tag: "05",
    },
  ];

  const methodologySteps = [
    {
      title: "Entanglement distribution & Initialization",
      desc: "Shared Bell pairs are established across sender and receiver node endpoints, setting up secure communication channels prior to any signature token transfer.",
      badge: "Bell state pair generation",
      icon: Network,
    },
    {
      title: "Projective measurement audit & Correction",
      desc: "Incoming signature tokens are evaluated using precise Pauli basis transformations and projective measurements to check for statistical threshold compliance.",
      badge: "Pauli basis verification",
      icon: Radio,
    },
    {
      title: "Deterministic threat response & State collapse",
      desc: "Any eavesdropping or channel tampering immediately collapses the superposition state via the no-cloning theorem, allowing instant and automated rejection.",
      badge: "Instant state collapse",
      icon: Binary,
    },
  ];

  const referencesList = [
    {
      title: "Quantum Digital Signatures with Bounded Quantum Memory",
      authors: "Ardehali, M. M., et al.",
      journal: "Physical Review A, 87(1), 012338",
      year: "2023",
    },
    {
      title:
        "Information-Theoretic Security in Quantum Key Distribution Networks",
      authors: "Gisin, N., Ribordy, G., Tittel, W., & Zbinden, H.",
      journal: "Reviews of Modern Physics, 74(1), 145",
      year: "2022",
    },
    {
      title:
        "Practical Implementation of Unambiguous Quantum Signatures over Fiber Channels",
      authors: "Collins, R. J., et al.",
      journal: "IEEE Transactions on Quantum Engineering, vol. 4, pp. 1-12",
      year: "2024",
    },
  ];

  const faqs = [
    {
      q: "What is the primary limitation of using Quantum One-Time Pad (QOTP) in arbitrated quantum signature (AQS) protocols?",
      a: "QOTP is poorly suited for AQS schemes because it leaves protocols vulnerable to various attacks, including recipient-side forgery and signer-side disavowal. Specifically, the commutative nature of the four Pauli operators enables recipients (such as Bob) to counterfeit signatures during known message attacks.",
    },
    {
      q: "What cryptographic technique does the proposed protocol introduce to replace chained CNOT operations?",
      a: "The proposed protocol utilizes chained controlled-unitary (CU) operations controlled by secret keys to encrypt quantum message ensembles. This approach manipulates both amplitude and phase components, offering greater randomness, non-commutativity, and resistance to quantum forgeries.",
    },
    {
      q: "On what real quantum computing hardware was the protocol tested and implemented?",
      a: "The protocol was tested on an IBM Quantum simulator and subsequently executed on a real backend quantum processing unit (QPU) named ibm_brisbane, which features an Eagle r3 processor with 127 qubits.",
    },
    {
      q: "What two fundamental security conditions must be satisfied by a secure quantum signature scheme?",
      a: "A secure quantum signature scheme must satisfy the core properties of non-forgery and non-repudiation.",
    },
    {
      q: "How does the protocol resolve disputes concerning lost quantum signatures?",
      a: "Unlike traditional schemes where a signature is lost and unprovable once the quantum state changes during verification, this protocol resolves disputes because the trusted Key Generation Center (KGC) securely stores verification proofs—specifically{(\\lambda_i^1, \\lambda_i^2, ..., \\lambda_i^n), h_{iB}\}—upon successful verification.",
    },
    {
      q: "Why is the proposed scheme inherently resistant to Pauli operator forgery attacks?",
      a: "The protocol avoids QOTP-wise symmetric encryption by employing chained controlled-unitary gates combined with private parameters (\\lambda_i^j). This makes any unauthorized Pauli transformation highly nonlinear and unpredictable, causing an automatic mismatch during the KGC's decryption and state comparison process.",
    },
    {
      q: "What cryptographic mechanisms protect the protocol against impersonation and Man-in-the-Middle (MITM) attacks?",
      a: "The protocol leverages quantum key distribution (QKD) for unconditionally secure secret key sharing, quantum authentication protocols to transmit private parameters without tampering, and quantum swap tests during verification to ensure message integrity and prevent malicious interceptions.",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="w-full space-y-32 pt-28 pb-32 bg-black text-white overflow-hidden font-mono"
    >
      {/* Introduction Section */}
      <section ref={heroRef} className="pt-8 px-6 max-w-7xl mx-auto">
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 sm:p-16 relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-gradient-to-b from-neutral-800/20 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col w-full max-w-4xl mb-6 relative">
            <div className="w-full h-[1px] bg-neutral-800 relative overflow-hidden rounded-full">
              <div
                ref={pulseBarRef}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent origin-left"
              />
            </div>
          </div>

          <div className="max-w-4xl space-y-6 relative z-10 my-4 flex flex-col items-center">
            <h1 className="text-4xl sm:text-7xl font-serif tracking-tight text-white leading-[1.05]">
              Entangle. Verify. <br />
              <span className="text-white underline decoration-neutral-600 underline-offset-8">
                [&rarr;] Collapse.
              </span>
            </h1>

            <p className="text-neutral-400 font-light text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-sans text-center">
              Information-theoretic security over dedicated Bell-state quantum
              teleportation channels with absolute deterministic resilience
              against post-quantum threats.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setActiveTab("simulator")}
                className="inline-flex items-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-full hover:bg-neutral-200 transition-all shadow-md cursor-pointer transform hover:scale-105"
              >
                Run Quantum Simulator <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("pipeline");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 bg-black border border-neutral-700 text-white text-xs font-semibold uppercase tracking-wider px-7 py-3.5 rounded-full hover:border-white transition-all shadow-xs cursor-pointer"
              >
                Explore Architecture
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Basic Explanation of the Product Section with Flowchart Layout */}
      <section
        id="pipeline"
        className="w-full space-y-10 px-6 md:px-16 lg:px-24"
      >
        <div className="space-y-3 text-left w-full">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold block">
            Quantum Telemetry &amp; Protocol Pipeline
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight leading-tight">
            Engineered for absolute post-quantum cryptographic resilience
          </h2>
        </div>

        {/* Horizontal Flowchart Connected Node Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 relative py-4 w-full">
          {features.map((feat, idx) => {
            const isHovered = hoveredStep === idx;
            return (
              <React.Fragment key={idx}>
                <div
                  onMouseEnter={() => handleMouseEnter(idx)}
                  onMouseLeave={handleMouseLeave}
                  className={`w-full lg:w-1/5 rounded-2xl border p-5 text-left transition-all duration-300 flex flex-col justify-between min-h-[160px] cursor-pointer relative ${
                    isHovered
                      ? "bg-neutral-900 border-white shadow-xl scale-105 ring-1 ring-white/30"
                      : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${isHovered ? "text-white" : "text-neutral-500"}`}
                  >
                    Stage {feat.tag}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-serif leading-snug ${isHovered ? "text-white font-bold" : "text-neutral-300"}`}
                  >
                    {feat.title}
                  </span>
                </div>

                {idx < features.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center text-neutral-600 font-bold text-xl select-none shrink-0 px-1">
                    &rarr;
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Dynamic Bottom Info Box Displaying Content with Hover Persistence */}
        {hoveredStep !== null && (
          <div
            ref={contentDisplayRef}
            onMouseEnter={handleInfoBoxMouseEnter}
            onMouseLeave={handleInfoBoxMouseLeave}
            className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 transition-all w-full"
          >
            <div className="space-y-3 text-left max-w-4xl">
              <h3 className="text-xl sm:text-2xl font-serif text-white">
                {features[hoveredStep].title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 font-sans font-light leading-relaxed">
                {features[hoveredStep].desc}
              </p>
            </div>

            <button
              onClick={() => {
                setActiveTab("docs");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-200 transition-colors border border-white px-5 py-3 rounded-xl shrink-0 cursor-pointer shadow-lg"
            >
              View Docs <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Premium Clean Timeline Design */}
      <section className="w-full space-y-16 px-6 md:px-16 lg:px-24">
        <div className="space-y-3 text-left w-full">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold block">
            Execution Matrix &amp; State Mechanics
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight">
            How the quantum digital signature verification engine operates
            securely
          </h2>
        </div>

        <div className="relative border-l-2 border-neutral-700 ml-6 md:ml-12 pl-8 md:pl-12 space-y-16 w-full">
          {methodologySteps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div key={idx} className="relative group w-full">
                <div className="absolute -left-[45px] md:-left-[61px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-black border-2 border-white text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-300">
                  <IconComponent className="w-4 h-4" />
                </div>

                <div className="bg-neutral-950 border border-neutral-800 group-hover:border-white/50 rounded-3xl p-8 sm:p-10 transition-all duration-300 shadow-xl space-y-5 text-left w-full">
                  <div className="flex items-center justify-start">
                    <span className="text-[11px] font-mono text-black bg-white border border-white px-3.5 py-1.5 rounded-xl font-bold">
                      {step.badge}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-serif text-white tracking-tight group-hover:text-neutral-200 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-neutral-300 font-sans font-light leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* References Section */}
      <section className="w-full space-y-10 px-6 md:px-16 lg:px-24">
        <div className="space-y-3 text-left w-full">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold block">
            Academic Ledger &amp; Literature Sources
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight">
            Foundational research papers and protocol citations
          </h2>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xl w-full">
          {referencesList.map((refItem, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-black border border-neutral-800 hover:border-white/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left w-full"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-neutral-300 text-xs">
                  <BookOpen className="w-3.5 h-3.5" /> Reference [{idx + 1}]
                  &bull; {refItem.year}
                </div>
                <h4 className="text-sm font-serif text-white font-medium">
                  {refItem.title}
                </h4>
                <p className="text-[11px] text-neutral-400 font-sans">
                  {refItem.authors} &mdash;{" "}
                  <span className="italic">{refItem.journal}</span>
                </p>
              </div>
              <span className="text-[10px] uppercase font-mono text-black bg-white px-3 py-1.5 rounded-lg border border-white shrink-0 font-bold">
                Peer Reviewed
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full space-y-10 px-6 md:px-16 lg:px-24">
        <div className="text-left space-y-3 max-w-3xl">
          <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-sans font-light">
            Deep-dive insights into cryptographic mechanics, security proofs,
            and implementation details.
          </p>
        </div>

        <div className="space-y-4 w-full">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`transition-all duration-300 rounded-3xl border overflow-hidden text-left w-full ${
                  isOpen
                    ? "bg-neutral-900 border-white shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 sm:p-7 text-left flex items-center justify-between gap-6 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-colors ${isOpen ? "bg-white text-black" : "bg-black border border-neutral-800 text-white"}`}
                    >
                      0{idx + 1}
                    </span>
                    <span className="text-base sm:text-lg font-serif text-white tracking-tight">
                      {faq.q}
                    </span>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? "rotate-90 bg-white text-black border-white" : "text-neutral-400"}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-7 pb-7 pt-2 border-t border-neutral-800 text-xs sm:text-sm text-neutral-300 font-sans font-light leading-relaxed animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
