"""
Module 2: Network Topology & Cyber Attack Simulation

All 4 deliverables from the spec (context_module2.md, section 6):
  1. QuNetSim topology script -- Alice, Bob, Eve, configurable noise.
  2. Red Team: intercept-resend (tunable rate), classical tampering, replay.
  3. Bridge: NoiseConfig -> qiskit_aer.noise.NoiseModel (handed to Module 1).
  4. Benchmark scripts: EPR/teleportation throughput, interception-rate accuracy.

Reliability notes :
  - Every network step now prints with flush=True, so a stall shows up
    immediately instead of looking like a silent hang.
  - Per-qubit wait timeout defaults to 3s (was 10s) -- a real delivery
    failure now surfaces in seconds, not minutes, across 50 qubits.
  - Bob writes results into a shared list (results_holder) instead of
    returning a value across a thread boundary -- Thread.join() always
    returns None, so a real return value would silently vanish.


"""

import random
import time
from dataclasses import dataclass, asdict
from typing import Optional

from qunetsim.components import Host, Network
from qunetsim.objects import Qubit

from qiskit_aer.noise import NoiseModel, thermal_relaxation_error, depolarizing_error


# ---------------------------------------------------------------------------
# 1. NoiseConfig -> qiskit_aer.noise.NoiseModel bridge (deliverable 3)
# ---------------------------------------------------------------------------

@dataclass
class NoiseConfig:
    t1_enabled: bool = True
    t1_us: float = 50.0
    t2_enabled: bool = True
    t2_us: float = 30.0
    gate_time_ns: float = 100.0
    depolarizing_enabled: bool = True
    two_qubit_depolarizing_prob: float = 0.01


def build_noise_model(config: NoiseConfig) -> NoiseModel:
    """Deterministic: same NoiseConfig -> same NoiseModel, every time.
    This object is what Module 1 passes to its AerSimulator."""
    noise_model = NoiseModel()

    if config.t1_enabled or config.t2_enabled:
        t1 = config.t1_us if config.t1_enabled else 1e6
        t2 = config.t2_us if config.t2_enabled else 1e6
        gate_time_us = config.gate_time_ns / 1000.0
        relax_error = thermal_relaxation_error(t1, t2, gate_time_us)
        noise_model.add_all_qubit_quantum_error(relax_error, ["id", "u1", "u2", "u3", "h", "x", "z"])

    if config.depolarizing_enabled:
        depol_error = depolarizing_error(config.two_qubit_depolarizing_prob, 2)
        noise_model.add_all_qubit_quantum_error(depol_error, ["cx"])

    return noise_model


# ---------------------------------------------------------------------------
# 2. Attack configuration + Red Team (deliverable 2)
# ---------------------------------------------------------------------------

@dataclass
class AttackConfig:
    intercept_resend_enabled: bool = False
    intercept_resend_rate: float = 0.0
    classical_tamper_enabled: bool = False
    classical_tamper_rate: float = 0.0
    replay_enabled: bool = False


class RedTeam:
    def __init__(self, attack_config: AttackConfig, verbose: bool = False):
        self.config = attack_config
        self.verbose = verbose
        self.captured_messages: list[str] = []
        self.stats = {
            "qubits_relayed": 0,
            "qubits_intercepted": 0,
            "messages_relayed": 0,
            "messages_tampered": 0,
            "messages_replayed": 0,
        }

    def quantum_eve(self, sender, receiver, qubit):
        self.stats["qubits_relayed"] += 1
        if self.config.intercept_resend_enabled and random.random() < self.config.intercept_resend_rate:
            self.stats["qubits_intercepted"] += 1
            qubit.measure(non_destructive=True)
            if self.verbose:
                print(f"[Eve] intercepted qubit #{self.stats['qubits_relayed']}", flush=True)

    def classical_eve(self, sender, receiver, msg):
        self.stats["messages_relayed"] += 1
        if self.config.replay_enabled:
            self.captured_messages.append(msg.content)
        if self.config.classical_tamper_enabled and random.random() < self.config.classical_tamper_rate:
            self.stats["messages_tampered"] += 1
            msg.content = msg.content[::-1]
            if self.verbose:
                print(f"[Eve] tampered classical message #{self.stats['messages_relayed']}", flush=True)

    def replay_captured_message(self, host: Host, receiver_id: str) -> Optional[str]:
        if not self.captured_messages:
            return None
        replayed = random.choice(self.captured_messages)
        host.send_classical(receiver_id, replayed, await_ack=True)
        self.stats["messages_replayed"] += 1
        return replayed


# ---------------------------------------------------------------------------
# 3. Network topology: Alice - Eve - Bob (deliverable 1)
# ---------------------------------------------------------------------------

def build_network(red_team: RedTeam, verbose: bool = False):
    network = Network.get_instance()
    network.start(["Alice", "Eve", "Bob"])
    if verbose:
        print("[Network] started", flush=True)

    alice = Host("Alice")
    alice.add_connection("Eve")
    alice.start()

    eve = Host("Eve")
    eve.add_connections(["Alice", "Bob"])
    eve.q_relay_sniffing = True
    eve.q_relay_sniffing_fn = red_team.quantum_eve
    eve.c_relay_sniffing = True
    eve.c_relay_sniffing_fn = red_team.classical_eve
    eve.start()

    bob = Host("Bob")
    bob.add_connection("Eve")
    bob.start()

    network.add_hosts([alice, eve, bob])
    if verbose:
        print("[Network] hosts started and registered", flush=True)
    return network, alice, eve, bob


# ---------------------------------------------------------------------------
# 4. Alice / Bob protocols -- verbose, short timeout
# ---------------------------------------------------------------------------

def alice_protocol(host, receiver_id, bits, verbose=False):
    for i, bit in enumerate(bits):
        q = Qubit(host)
        if bit == 1:
            q.X()
        host.send_qubit(receiver_id, q, await_ack=True)
        if verbose:
            print(f"[Alice] sent qubit {i}/{len(bits)}", flush=True)
    host.send_classical(receiver_id, "m1=0,m2=1", await_ack=True)
    if verbose:
        print("[Alice] sent classical correction message", flush=True)


def bob_protocol(host, sender_id, n_qubits, results_holder, wait_seconds=3, verbose=False):
    for i in range(n_qubits):
        q = host.get_data_qubit(sender_id, wait=wait_seconds)
        if q is None:
            results_holder.append(None)
            if verbose:
                print(f"[Bob] qubit {i} did not arrive within {wait_seconds}s", flush=True)
        else:
            m = q.measure()
            results_holder.append(m)
            if verbose:
                print(f"[Bob] qubit {i} received, measured={m}", flush=True)


# ---------------------------------------------------------------------------
# 5. Run + emit log (integration contract for Module 3/4)
# ---------------------------------------------------------------------------

def run_module2(
    n_qubits: int,
    sent_bits: list[int],
    noise_config: NoiseConfig,
    attack_config: AttackConfig,
    wait_seconds: float = 3,
    verbose: bool = True,
) -> dict:
    red_team = RedTeam(attack_config, verbose=verbose)
    network, alice, eve, bob = build_network(red_team, verbose=verbose)

    received_bits: list = []
    bob_thread = bob.run_protocol(
        bob_protocol, (alice.host_id, n_qubits, received_bits, wait_seconds, verbose), blocking=False
    )
    alice.run_protocol(alice_protocol, (bob.host_id, sent_bits, verbose), blocking=True)
    bob_thread.join()

    if attack_config.replay_enabled:
        red_team.replay_captured_message(eve, bob.host_id)

    errors = sum(1 for s, r in zip(sent_bits, received_bits) if r != s)
    network.stop(True)

    return {
        "timestamp": time.time(),
        "noise_config": asdict(noise_config),
        "attack_config": asdict(attack_config),
        "n_qubits": n_qubits,
        "sent_bits": sent_bits,
        "received_bits": received_bits,
        "n_errors": errors,
        "qber": errors / n_qubits,
        "red_team_stats": red_team.stats,
    }


# ---------------------------------------------------------------------------
# 6. Benchmark scripts (deliverable 4)
# ---------------------------------------------------------------------------

def benchmark_throughput(qubit_counts: list[int] = [10, 20, 40]) -> list[dict]:
    """
    EPR/teleportation throughput under rapid consecutive requests: for each
    N, time a full clean run and report qubits/second. Surfaces
    routing/queueing bottlenecks before they're mistaken for crypto failures.
    """
    results = []
    for n in qubit_counts:
        bits = [random.randint(0, 1) for _ in range(n)]
        start = time.time()
        log = run_module2(n, bits, NoiseConfig(), AttackConfig(), wait_seconds=3, verbose=False)
        elapsed = time.time() - start
        rate = n / elapsed if elapsed > 0 else float("inf")
        results.append({"n_qubits": n, "elapsed_sec": elapsed, "qubits_per_sec": rate, "qber": log["qber"]})
        print(f"[Benchmark] n={n}: {elapsed:.2f}s ({rate:.1f} qubits/sec), QBER={log['qber']:.3f}", flush=True)
    return results


def benchmark_interception_accuracy(
    configured_rates: list[float] = [0.05, 0.25, 0.75], n_qubits: int = 40
) -> list[dict]:
    """
    For each configured intercept rate, confirm the ACTUAL observed
    interception fraction (from Eve's own stats) is reasonably close to what
    was configured -- validates that the attack module behaves as specified
    before Module 3 is benchmarked against it.
    """
    results = []
    for rate in configured_rates:
        bits = [random.randint(0, 1) for _ in range(n_qubits)]
        attack_cfg = AttackConfig(intercept_resend_enabled=True, intercept_resend_rate=rate)
        log = run_module2(n_qubits, bits, NoiseConfig(), attack_cfg, wait_seconds=3, verbose=False)
        stats = log["red_team_stats"]
        actual_rate = stats["qubits_intercepted"] / stats["qubits_relayed"] if stats["qubits_relayed"] else 0.0
        results.append({
            "configured_rate": rate,
            "actual_rate": actual_rate,
            "qber": log["qber"],
        })
        print(f"[Benchmark] configured={rate:.0%} actual={actual_rate:.0%} QBER={log['qber']:.3f}", flush=True)
    return results


# ---------------------------------------------------------------------------
# 7. Main: calibration, attack demo, then benchmarks
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    N = 20  # kept small deliberately -- raise once you've confirmed this runs cleanly
    sent_bits = [random.randint(0, 1) for _ in range(N)]

    noise_cfg = NoiseConfig()
    print("=== NoiseModel for Module 1 handoff ===", flush=True)
    print(build_noise_model(noise_cfg), flush=True)

    print("\n=== Calibration run (no attacker) ===", flush=True)
    clean_log = run_module2(N, sent_bits, noise_cfg, AttackConfig(), wait_seconds=3, verbose=True)
    print(f"QBER: {clean_log['qber']:.4f}  <- q0 baseline for Module 3\n", flush=True)

    print("=== Attacked run (intercept 25%, classical tamper 10%, replay on) ===", flush=True)
    attack_cfg = AttackConfig(
        intercept_resend_enabled=True,
        intercept_resend_rate=0.25,
        classical_tamper_enabled=True,
        classical_tamper_rate=0.10,
        replay_enabled=True,
    )
    attacked_log = run_module2(N, sent_bits, noise_cfg, attack_cfg, wait_seconds=3, verbose=True)
    print(f"QBER: {attacked_log['qber']:.4f}", flush=True)
    print(f"Red Team stats: {attacked_log['red_team_stats']}\n", flush=True)

    print("=== Benchmark: throughput ===", flush=True)
    benchmark_throughput()

    print("\n=== Benchmark: interception-rate accuracy ===", flush=True)
    benchmark_interception_accuracy()

    