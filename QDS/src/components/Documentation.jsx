import React from "react";

export default function Documentation() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <div className="mb-10 pb-6 border-b border-neutral-300">
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 block mb-1">
          SYSTEM DOCUMENTATION v2.4
        </span>
        <h1 className="text-3xl font-serif text-neutral-950">
          QDS-Secure Technical Specifications
        </h1>
      </div>

      <div className="space-y-10 text-neutral-700 font-light text-sm sm:text-base leading-relaxed">
        <section className="space-y-3 bg-white p-8 rounded-2xl border border-neutral-300 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900 font-serif">
            1. Introduction & Background
          </h2>
          <p>
            Quantum computing threatens classical public-key cryptography.
            Algorithms like Shor's efficiently solve integer factorization,
            rendering RSA and ECC obsolete. QDS-Secure introduces an alternative
            approach grounded in quantum mechanics for absolute security.
          </p>
        </section>

        <section className="space-y-3 bg-white p-8 rounded-2xl border border-neutral-300 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900 font-serif">
            2. Teleportation-Based Protocols
          </h2>
          <p>
            To handle real-world deployment challenges, the framework utilizes
            teleportation-based QDS protocols, leveraging pre-shared Bell-state
            entanglement pairs to securely transfer signature tokens.
          </p>
        </section>

        <section className="space-y-3 bg-white p-8 rounded-2xl border border-neutral-300 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900 font-serif">
            3. Threat Detection Model
          </h2>
          <p>
            Instead of black-box machine learning, QDS-Secure relies on
            deterministic physics. Forgery attempts trigger state collapse via
            the no-cloning theorem, which is caught by statistical threshold
            rules.
          </p>
        </section>

        <section className="space-y-3 bg-white p-8 rounded-2xl border border-neutral-300 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900 font-serif">
            4. Quick Start & Installation
          </h2>
          <div className="bg-neutral-900 text-neutral-200 p-5 rounded-xl font-mono text-xs space-y-1.5">
            <p className="text-neutral-400"># Clone the repository</p>
            <p>git clone https://github.com/qds-secure/framework.git</p>
            <p className="text-neutral-400 pt-2">
              # Install dependencies & run simulator
            </p>
            <p>npm install && npm run simulator</p>
          </div>
        </section>
      </div>
    </div>
  );
}
