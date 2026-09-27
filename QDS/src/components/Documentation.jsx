import React, { useState } from "react";

const articles = [
  {
    id: "overview",
    number: "01",
    title: "Executive Overview & Core Principles",
    category: "FOUNDATION",
    readTime: "4 MIN READ",
    summary:
      "A high-level examination of quantum-oriented digital signatures, zero-trust endpoint architectures, and the elimination of reliance on classical computational hardness assumptions.",
    content: [
      "Quantum computing fundamentally shifts the paradigm of cryptographic trust. Algorithms designed to run on scalable quantum processors—most notably Shor's algorithm—solve discrete logarithms and integer factorization in polynomial time, entirely compromising classical public-key infrastructures such as RSA, DSA, and Elliptic Curve Cryptography (ECC).",
      "To counter this existential vector, QDS.Engine establishes an information-theoretic security model. Security is derived directly from the fundamental laws of quantum mechanics rather than unproven mathematical complexity.",
      "By anchoring digital signatures to microscopic physical phenomena, any unauthorized eavesdropping or intermediate interception physically alters the transmission state, providing absolute mathematical certainty against forgery and undetected data tampering.",
    ],
    highlights: [
      "Information-theoretic security guarantees independent of compute power",
      "Immunity against polynomial-time quantum attacks (Shor's & Grover's)",
      "Zero reliance on classical mathematical trapdoor functions",
    ],
  },
  {
    id: "bell-state",
    number: "02",
    title: "Bell-State Entanglement Pipeline",
    category: "QUANTUM CHANNEL",
    readTime: "6 MIN READ",
    summary:
      "Detailed breakdown of how multi-endpoint state generation, shared particle correlation, and synchronized verification establish baseline session trust.",
    content: [
      "The core transmission pipeline begins before any payload or signature token is transferred. Trusted nodes (historically modeled as Alice and Bob) initialize a synchronized generation of maximally entangled Bell states (|Φ⁺⟩, |Φ⁻⟩, |Ψ⁺⟩, or |Ψ⁻⟩).",
      "These entangled pairs serve as the atomic foundation for subsequent signature validation. Because measuring one entangled qubit instantly dictates the state of its paired counterpart across the channel, any active man-in-the-middle intervention forces premature wave function collapse.",
      "The protocol enforces strict threshold validation: if environmental or malicious noise exceeds predetermined parameters, the session drops instantly before signature payload decryption can be initiated.",
    ],
    highlights: [
      "Pre-shared Bell-state pair generation across trusted endpoints",
      "Immediate wave function collapse upon external state observation",
      "Configurable environmental noise tolerance and drift thresholds",
    ],
  },
  {
    id: "pauli-basis",
    number: "03",
    title: "Pauli Basis Correction & Wave Mechanics",
    category: "STATE TRANSFORMATION",
    readTime: "5 MIN READ",
    summary:
      "Mathematical and algorithmic execution of rotational matrix adjustments, basis reconciliation, and classical bit calibration.",
    content: [
      "During transit, quantum states are susceptible to phase shifts and bit-flip errors caused by environmental decoherence. The Pauli Basis Correction layer applies controlled unitary transformations (using Pauli operators X, Y, and Z) to reconcile discrepancies.",
      "Once the quantum transmission phase concludes, endpoints execute a classical reconciliation handshake over an authenticated public channel, comparing a randomized subset of test bits to calculate exact error rates.",
      "If the evaluated error rate remains within acceptable boundary parameters, the system applies deterministic correction matrices to restore complete signal fidelity prior to final digital signature acceptance.",
    ],
    highlights: [
      "Real-time application of Pauli X, Y, and Z rotational operators",
      "Statistically rigorous subset sampling for error rate estimation",
      "Deterministic post-processing calibration for high signal fidelity",
    ],
  },
  {
    id: "no-cloning",
    number: "04",
    title: "No-Cloning Theorem & Threat Detection",
    category: "SECURITY ASSURANCE",
    readTime: "5 MIN READ",
    summary:
      "Exploiting the quantum no-cloning theorem to build deterministic intrusion detection systems that bypass classical heuristic limitations.",
    content: [
      "Conventional security systems rely on heuristic anomaly detection, signature databases, and machine learning models that remain inherently vulnerable to zero-day exploits and sophisticated evasion techniques.",
      "QDS.Engine replaces heuristic guesswork with the physical laws of quantum mechanics—specifically the No-Cloning Theorem, which dictates that it is physically impossible to create an identical independent copy of an unknown arbitrary quantum state.",
      "Any attempt by an adversary to duplicate or inspect signature packets in transit causes irreversible modification. The threat detection module continuously audits packet telemetry, instantly isolating and rejecting compromised communication vectors.",
    ],
    highlights: [
      "Physical enforcement via the quantum no-cloning theorem",
      "Zero reliance on historical attack signature databases",
      "Instantaneous session termination upon intrusion detection",
    ],
  },
];

export default function Documentation() {
  const [activeArticleId, setActiveArticleId] = useState("overview");
  const activeArticle =
    articles.find((a) => a.id === activeArticleId) || articles[0];

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 font-sans pt-28 pb-20 px-6 sm:px-10 lg:px-20 selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_50%)]" />

      <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
        <div className="border-b border-slate-800 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 font-mono text-xs text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>QDS.ENGINE // TECHNICAL KNOWLEDGE BASE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif text-white tracking-tight">
            Architecture Documentation
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-light max-w-2xl leading-relaxed">
            Deep-dive technical specifications, quantum pipeline mechanics, and
            security model doctrines governing the QDS.Engine framework.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Menu (List of Articles) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="font-mono text-xs uppercase tracking-widest text-slate-500 px-2 pb-2">
              Documentation Index
            </div>

            <div className="space-y-2">
              {articles.map((article) => {
                const isSelected = article.id === activeArticleId;
                return (
                  <button
                    key={article.id}
                    onClick={() => {
                      setActiveArticleId(article.id);
                      window.scrollTo({ top: 180, behavior: "smooth" });
                    }}
                    className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col space-y-2 ${
                      isSelected
                        ? "bg-[#0b0e17] border-indigo-500 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50"
                        : "bg-[#0b0e17]/60 border-slate-800/80 hover:border-slate-700 hover:bg-[#0b0e17]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span
                        className={`font-bold ${isSelected ? "text-indigo-400" : "text-slate-500"}`}
                      >
                        {article.number}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {article.readTime}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block font-medium">
                        {article.category}
                      </span>
                      <h3
                        className={`text-base font-serif transition-colors ${isSelected ? "text-white" : "text-slate-300"}`}
                      >
                        {article.title}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-[#0b0e17] border border-slate-800/90 rounded-3xl p-8 sm:p-12 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-indigo-950 border border-indigo-800/80 text-indigo-300 font-bold">
                    MODULE {activeArticle.number}
                  </span>
                  <span className="text-slate-400 uppercase tracking-widest">
                    {activeArticle.category}
                  </span>
                </div>
                <span className="text-slate-500">{activeArticle.readTime}</span>
              </div>


              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-serif text-white leading-snug">
                  {activeArticle.title}
                </h2>
                <p className="text-sm sm:text-base text-indigo-200/80 font-sans font-light leading-relaxed p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40">
                  {activeArticle.summary}
                </p>
              </div>

              <div className="space-y-6 text-slate-300 font-sans font-light text-sm sm:text-base leading-relaxed">
                {activeArticle.content.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <div className="pt-4 space-y-4 border-t border-slate-800">
                <h4 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
                  Core Architectural Highlights
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {activeArticle.highlights.map((highlight, hIndex) => (
                    <div
                      key={hIndex}
                      className="flex items-start gap-3 p-4 rounded-xl bg-[#07090e] border border-slate-800/80 font-mono text-xs text-slate-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>


              <div className="pt-6 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-500">
                <span>QDS.ENGINE SPECIFICATION DOCS</span>
                <span className="text-indigo-400 font-semibold">
                  [SECURE VERIFIED]
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
