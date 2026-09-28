"""
Module 2: Network Topology & Cyber Attack Simulation (Noise Component)

Contains only the NoiseConfig and Qiskit NoiseModel builder.
"""

from dataclasses import dataclass
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
