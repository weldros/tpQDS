import random
from dataclasses import dataclass
from typing import Optional
from qunetsim.components import Host

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
