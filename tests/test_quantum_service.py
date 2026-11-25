import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import HTTPException, Response

from backend import main, quantum_service


class QuantumServiceTests(unittest.TestCase):
    def test_only_post_is_registered_for_a_spin(self):
        methods = [route.methods for route in main.app.routes if route.path == "/quantum-spin"]
        self.assertEqual(methods, [{"POST"}])

    def test_denied_request_does_not_spend_entropy(self):
        with patch.dict(os.environ, {"QUANTUM_ACCESS_CODE": "demo-code"}), patch.object(main.entropy, "get_spin") as spin:
            with self.assertRaises(HTTPException) as denial:
                main.spin(Response(), "wrong-code")
            self.assertEqual(denial.exception.status_code, 401)
            spin.assert_not_called()
            main.spin(Response(), "demo-code")
            spin.assert_called_once()

    def test_batch_keeps_order_and_rejects_out_of_range_shots(self):
        entropy = quantum_service.QuantumEntropyService()
        job = Mock()
        job.job_id.return_value = "fake-job"
        measurement = SimpleNamespace(get_bitstrings=lambda: ["000001", "111111", "000010", "000001"])
        job.result.return_value = [SimpleNamespace(data=SimpleNamespace(meas=measurement))]
        entropy.pending_job = job

        entropy._refill()

        self.assertEqual([entropy.spins.get_nowait()["value"] for _ in range(3)], [1, 2, 1])
        self.assertIsNone(entropy.pending_job)

    def test_result_timeout_preserves_pending_job(self):
        entropy = quantum_service.QuantumEntropyService()
        entropy.pending_job = Mock()
        entropy.pending_job.result.side_effect = TimeoutError
        entropy.pending_job.in_final_state.return_value = False
        pending_job = entropy.pending_job

        entropy._refill()

        self.assertIs(entropy.pending_job, pending_job)
        self.assertFalse(entropy.refilling)

    def test_startup_failure_can_retry(self):
        entropy = quantum_service.QuantumEntropyService()
        with patch.object(quantum_service, "connect_backend", side_effect=ConnectionError):
            entropy._connect()
        self.assertIsNone(entropy.backend)
        self.assertFalse(entropy.connecting)
        self.assertGreater(entropy.next_connect_at, quantum_service.time.monotonic())
        recovered = SimpleNamespace(name="fake-backend")
        with patch.object(quantum_service, "connect_backend", return_value=recovered):
            entropy._connect()
        self.assertIs(entropy.backend, recovered)


if __name__ == "__main__":
    unittest.main()
