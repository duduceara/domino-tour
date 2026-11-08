"""Synthetic unit fixtures certify comparator behavior, never game screenshots."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'compare-premium-screenshots.py'

class ComparatorContract(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.a, self.b = (Path(self.tmp.name) / n for n in ('approved-fixture.png', 'candidate-fixture.png'))
        for p in (self.a, self.b):
            Image.new('RGB', (64, 64), '#03172d').save(p)

    def run_compare(self):
        return subprocess.run([sys.executable, str(SCRIPT), str(self.a), str(self.b)], capture_output=True, text=True)

    def test_identical_fixture_passes(self):
        self.assertEqual(self.run_compare().returncode, 0)

    def test_changed_pixels_fail_and_emit_diff(self):
        Image.new('RGB', (64, 64), 'white').save(self.b)
        self.assertNotEqual(self.run_compare().returncode, 0)
        self.assertTrue(self.b.with_suffix('.diff.png').is_file())

    def test_missing_baseline_fails_without_generating_one(self):
        self.a.unlink()
        self.assertNotEqual(self.run_compare().returncode, 0)
        self.assertFalse(self.a.exists())

    def test_viewport_mismatch_fails(self):
        Image.new('RGB', (80, 64), '#03172d').save(self.b)
        self.assertNotEqual(self.run_compare().returncode, 0)

if __name__ == '__main__':
    unittest.main()
