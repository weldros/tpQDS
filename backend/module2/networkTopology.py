import time
import random
from dataclasses import asdict
from typing import Optional

from qunetsim.components import Host, Network
from qunetsim.objects import Qubit

from .noise import NoiseConfig, build_noise_model
from .attackSimulation import AttackConfig, RedTeam

# ---------------------------------------------------------------------------
# 1. Network topology: Alice - Eve - Bob
# ---------------------------------------------------------------------------

def build_network(verbose: bool = False):
    red_team = RedTeam(AttackConfig())
    network = Network.get_instance()
    network.delay = 0.0  # Force 0s routing delay
    network.packet_drop_rate = 0.0
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
# 2. Alice / Bob protocols
# ---------------------------------------------------------------------------

def alice_protocol(host, receiver_id, bits, verbose=False):
    for i, bit in enumerate(bits):
        q = Qubit(host)
        if bit == 1:
            q.X()
        host.send_qubit(receiver_id, q, await_ack=False)
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
# 3. Main execution block
# ---------------------------------------------------------------------------

def run_topology_test(
    alice: Host,
    eve: Host,
    bob: Host,
    n_qubits: int,
    sent_bits: list[int],
    noise_config = None,
    attack_config = None,
    wait_seconds: float = 3,
    verbose: bool = True,
) -> dict:
    if attack_config is None:
        attack_config = AttackConfig()
    red_team = RedTeam(attack_config, verbose=verbose)
    
    # Dynamically update Eve's interception functions for this run
    eve.q_relay_sniffing_fn = red_team.quantum_eve
    eve.c_relay_sniffing_fn = red_team.classical_eve

    received_bits: list = []
    bob_thread = bob.run_protocol(
        bob_protocol, (alice.host_id, n_qubits, received_bits, wait_seconds, verbose), blocking=False
    )
    alice.run_protocol(alice_protocol, (bob.host_id, sent_bits, verbose), blocking=True)
    bob_thread.join()

    if attack_config.replay_enabled:
        red_team.replay_captured_message(eve, bob.host_id)

    errors = sum(1 for s, r in zip(sent_bits, received_bits) if r != s)

    return {
        "timestamp": time.time(),
        "noise_config": asdict(noise_config) if noise_config else None,
        "attack_config": asdict(attack_config) if attack_config else None,
        "n_qubits": n_qubits,
        "sent_bits": sent_bits,
        "received_bits": received_bits,
        "n_errors": errors,
        "qber": (errors / n_qubits) if n_qubits > 0 else 0,
        "red_team_stats": red_team.stats,
    }
