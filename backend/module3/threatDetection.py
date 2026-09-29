import math
from scipy.stats import binom

def getBaselineQber(noise_config_dict: dict) -> float:
    """
    Deterministically maps the active hardware noise configuration to an expected baseline QBER (q0).
    Returns a probability (0.0 to 1.0).
    """
    if not noise_config_dict or not noise_config_dict.get("depolarizing_enabled"):
        return 0.001 # Minimum baseline floor
    
    prob = noise_config_dict.get("two_qubit_depolarizing_prob", 0.0)
    
    # For a Bell state, depolarizing channel with prob p results in 3p/4 error rate
    expected_qber = prob * 0.75
    return max(0.001, expected_qber + 0.01)

def hoeffdingThreshold(m: int, q0: float, alpha: float = 1e-6) -> float:
    """
    Calculates the maximum allowable QBER threshold using Hoeffding's concentration bound.
    """
    if m <= 0:
        return 1.0
    return q0 + math.sqrt(math.log(1 / alpha) / (2 * m))

def forgeryProbability(k: int, m: int, q0: float) -> float:
    """
    Calculates the exact binomial tail probability (p-value).
    Probability of observing k or more errors if the true error rate is q0.
    """
    if k == 0:
        return 1.0
    return binom.sf(k - 1, m, q0)

def evaluateTransmission(m: int, k: int, noise_config_dict: dict, alpha: float = 1e-6) -> dict:
    """
    Scoring engine that evaluates a transmission and determines ACCEPT/REJECT.
    """
    q0 = getBaselineQber(noise_config_dict)
    observed_rate = k / m if m > 0 else 0
    threshold = hoeffdingThreshold(m, q0, alpha)
    
    p_value = forgeryProbability(k, m, q0)
    
    # We reject if the observed rate is strictly greater than the theoretical threshold
    verdict = "REJECT" if observed_rate > threshold else "ACCEPT"
    
    return {
        "m": m,
        "k": k,
        "q0_percentage": q0 * 100.0,
        "observed_percentage": observed_rate * 100.0,
        "threshold_percentage": threshold * 100.0,
        "p_value": p_value,
        "verdict": verdict
    }
