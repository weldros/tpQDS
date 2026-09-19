import React from "react";
import { ShieldCheck, Cpu, Activity, Zap } from "lucide-react";

const detailedSections = [
  {
    id: "what",
    step: "01",
    tag: "PURPOSE",
    title: "Quantum Public Key Distribution Engine",
    subtitle: "Absolute Information-Theoretic Security Bounds",
    content:
      "The framework acts as a robust software engine tailored for teleportation-based Quantum Digital Signature protocols. It simulates quantum public key distribution leveraging Bell-state entanglement and quantum teleportation channels without relying on unstable machine learning models.",
    metrics: [
      { label: "Security", value: "Information-Theoretic" },
      { label: "AI Model", value: "0% (Deterministic)" },
    ],
    icon: <ShieldCheck className="w-5 h-5 text-sky-600" />,
    alignClass: "self-start ml-2 sm:ml-8 lg:ml-12",
  },
  {
    id: "how",
    step: "02",
    tag: "MECHANISM",
    title: "Bell-State Teleportation & Pauli Correction",
    subtitle: "Deterministic Verification via Quantum Mechanics",
    content:
      "Initiates security by establishing shared Bell pairs between sender and receiver endpoints. Incoming tokens are evaluated via precise Pauli basis transformations and projective measurements for strict statistical threshold decision rules.",
    metrics: [
      { label: "Base State", value: "|Φ⁺⟩ = 1/√2(|00⟩ + |11⟩)" },
      { label: "Operation", value: "Pauli σₓ, σ₂ Matrices" },
    ],
    icon: <Cpu className="w-5 h-5 text-sky-600" />,
    alignClass: "self-end mr-2 sm:mr-8 lg:mr-12",
  },
  {
    id: "audience",
    step: "03",
    tag: "USERS",
    title: "Engineered for Cryptographers & Government Infrastructure",
    subtitle: "Multi-Party Communication Integrity",
    content:
      "Designed specifically for quantum cryptographers and academic researchers validating information-theoretic security bounds, as well as defense agencies requiring absolute communication integrity.",
    metrics: [
      { label: "Sector", value: "Post-Quantum Crypto" },
      { label: "Compliance", value: "NIST PQC Standards" },
    ],
    icon: <Activity className="w-5 h-5 text-sky-600" />,
    alignClass: "self-start ml-2 sm:ml-8 lg:ml-12",
  },
  {
    id: "why",
    step: "04",
    tag: "ADVANTAGES",
    title: "Immunity to Shor's Algorithm & Black-Box AI Flaws",
    subtitle: "Future-Proof Cryptographic Resilience",
    content:
      "Unlike classical RSA and ECC systems which are completely vulnerable to Shor’s algorithm, this solution provides absolute post-quantum resilience backed by the laws of quantum mechanics.",
    metrics: [
      { label: "Shor's Attack", value: "Fully Mitigated" },
      { label: "Complexity", value: "Optimized O(n)" },
    ],
    icon: <Zap className="w-5 h-5 text-sky-600" />,
    alignClass: "self-end mr-2 sm:mr-8 lg:mr-12",
  },
];

export default function Sections({ sectionRefs }) {
  return (
    <div className="w-full px-4 sm:px-10 lg:px-16 py-32 space-y-16 relative overflow-hidden">
      {/* Background Decorative Color Blocks for Pipeline Sections */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-sky-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto text-left space-y-3 pb-8 border-b border-neutral-300 relative z-10">
        <span className="text-xs font-mono uppercase tracking-widest text-sky-600">
          Pipeline Topology Flow
        </span>
        <h2 className="text-4xl sm:text-6xl font-serif tracking-tight text-neutral-950">
          Quantum Execution Pipeline
        </h2>
      </div>

      <div className="w-full max-w-[96%] mx-auto flex flex-col space-y-24 relative z-10">
        <div className="absolute top-20 bottom-20 left-1/2 -translate-x-1/2 w-px bg-neutral-300 hidden lg:block pointer-events-none" />

        {detailedSections.map((section, index) => (
          <div key={section.id} className="w-full flex flex-col relative">
            <div
              id={section.id}
              ref={(el) => {
                if (sectionRefs && sectionRefs.current) {
                  sectionRefs.current[index] = el;
                }
              }}
              className={`w-full lg:w-[62%] bg-gradient-to-br from-white via-white to-sky-50/40 border-t-2 border-t-sky-500 border-x border-b border-neutral-200 p-8 sm:p-12 relative transition-all duration-300 hover:border-neutral-900 shadow-sm ${section.alignClass}`}
            >
              <div className="absolute -top-3.5 left-6 bg-[#faf9f5] border border-neutral-300 text-neutral-900 font-mono text-xs px-3 py-1 rounded shadow-2xs">
                STEP {section.step} - {section.tag}
              </div>

              <div className="space-y-6 pt-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-serif text-neutral-950 tracking-tight">
                      {section.title}
                    </h3>
                    <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-medium">
                      {section.subtitle}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-[#faf9f5] border border-neutral-200 text-neutral-900 hidden sm:block">
                    {section.icon}
                  </div>
                </div>

                <p className="text-neutral-600 font-light text-base sm:text-lg leading-relaxed">
                  {section.content}
                </p>

                <div className="pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {section.metrics.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className="bg-[#faf9f5] p-3.5 border border-neutral-200 rounded flex justify-between items-center shadow-2xs"
                    >
                      <span className="text-[11px] font-mono uppercase text-neutral-400">
                        {m.label}
                      </span>
                      <span className="text-xs font-mono font-semibold text-neutral-900">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {index < detailedSections.length - 1 && (
              <div
                className={`my-6 flex items-center text-xs font-mono text-neutral-500 ${index % 2 === 0 ? "justify-end pr-12 lg:pr-32" : "justify-start pl-12 lg:pl-32"}`}
              >
                <span className="bg-white px-3.5 py-1.5 rounded border border-neutral-300 shadow-2xs tracking-wider text-neutral-700">
                  {index % 2 === 0
                    ? "Down Right Teleport Route"
                    : "Down Left Teleport Route"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
