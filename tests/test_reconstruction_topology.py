#!/usr/bin/env python3
"""Unittest contract for the independent offline source/fit morphology oracle."""
import colorsys
import importlib.util
from pathlib import Path
import tempfile
import unittest

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "reconstruction_topology", ROOT / "scripts/inspect-reconstruction-topology.py")
oracle = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(oracle)


class SourceMorphologyTests(unittest.TestCase):
    def test_black_or_neutral_pictures_do_not_invent_pigments_or_edge_scores(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "empty.png"
            Image.new("RGB", (180, 360), "black").save(path)
            result = oracle.diagnose(path, path)
            self.assertEqual([x["source"]["pixels"] for x in result["hues"]],
                             [0] * 7)
            self.assertTrue(all(x["boundaryChamferPx"] is None
                                for x in result["hues"]))
            self.assertEqual(result["blackNegativeSpace"]["dice"], 1.0)

    def test_same_actual_source_pixels_retain_unit_dice_and_zero_chamfer(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "genuine.png"
            picture = Image.new("RGB", (180, 360), "black")
            draw = ImageDraw.Draw(picture)
            for index, hue in enumerate(oracle.HUES):
                colour = tuple(int(v * 255) for v in
                               colorsys.hsv_to_rgb(float(hue) / 360, 1, 1))
                draw.rectangle((20, 25 + index * 45, 155, 39 + index * 45),
                               fill=colour)
            picture.save(path)
            result = oracle.diagnose(path, path)
            self.assertEqual(len(result["hues"]), 7)
            for row in result["hues"]:
                self.assertGreater(row["source"]["pixels"], 0)
                self.assertEqual(row["dice"], 1.0)
                self.assertEqual(row["boundaryChamferPx"], 0.0)
                self.assertEqual(row["source"], row["fit"])
            self.assertEqual(result["meanHueDice"], 1.0)

    def test_visible_doughnut_hole_is_counted_but_no_hidden_layer_is_invented(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "doughnut.png"
            picture = Image.new("RGB", (200, 400), "black")
            draw = ImageDraw.Draw(picture)
            draw.ellipse((40, 100, 160, 230), fill=(255, 0, 0))
            draw.ellipse((70, 130, 130, 200), fill=(0, 0, 0))
            picture.save(path)
            profile = oracle.mask_profile(oracle.seven_masks(path)[0])
            self.assertEqual(profile["components"], 1)
            self.assertEqual(profile["holes"], 1)
            self.assertGreater(profile["skeletonPixels"], 0)
            self.assertGreater(profile["widthMedian"], 0)

    def test_masks_are_bounded_and_missing_hues_never_divide_by_zero(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "red.png"
            Image.new("RGB", (80, 200), (255, 0, 0)).save(path)
            with self.assertRaisesRegex(ValueError, "bounded"):
                oracle.seven_masks(path, 1500, 1500)
            self.assertEqual(len(oracle.seven_masks(path)), 7)
            self.assertEqual(oracle.compare_masks(
                np.zeros((10, 10), dtype=bool),
                np.zeros((10, 10), dtype=bool))["dice"], 0)


if __name__ == "__main__":
    unittest.main()
