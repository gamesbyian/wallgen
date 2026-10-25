#!/usr/bin/env python3
"""Opt-in independent morphology oracle for source/fit PNGs.

Uses Pillow/NumPy/SciPy/scikit-image outside the browser application.
Reports observed raster pigment masks, black space, EDT edge distance and
medial-axis/width descriptors. It never infers or modifies a canonical recipe,
reads hidden R0 truth, selects a reconstruction, or asserts original paint order.

Install pinned optional tools in docs/reconstruction-diagnostics-requirements.txt.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.morphology import medial_axis

HUES = np.array([0, 29, 52, 136, 212, 244, 278], dtype=float)
DEFAULT_WIDTH, DEFAULT_HEIGHT = 277, 600
MAX_PIXELS = 650_000


def seven_masks(path: str | Path, width: int = DEFAULT_WIDTH,
                height: int = DEFAULT_HEIGHT) -> list[np.ndarray]:
    """Independent QA hue approximation of the existing seven canonical hues.

    Uses the same hue targets and broad saturation thresholds, but Pillow
    bilinear scaling and this standalone classification are not byte-identical
    with Chromium's shared importer. Never call it source-of-truth provenance.
    """
    if width < 24 or height < 24 or width * height > MAX_PIXELS:
        raise ValueError("Analysis dimensions outside the bounded image gate")
    with Image.open(path) as image:
        pixels = np.asarray(image.convert("RGB").resize(
            (width, height), Image.Resampling.BILINEAR), dtype=float)
    highest = pixels.max(axis=2)
    lowest = pixels.min(axis=2)
    delta = highest - lowest
    hue = np.zeros_like(highest)
    red = (highest == pixels[:, :, 0]) & (delta > 0)
    green = (highest == pixels[:, :, 1]) & (delta > 0) & ~red
    blue = (delta > 0) & ~red & ~green
    hue[red] = ((pixels[:, :, 1] - pixels[:, :, 2])[red] / delta[red]) % 6
    hue[green] = ((pixels[:, :, 2] - pixels[:, :, 0])[green] /
                  delta[green]) + 2
    hue[blue] = ((pixels[:, :, 0] - pixels[:, :, 1])[blue] /
                 delta[blue]) + 4
    hue = (hue * 60) % 360
    distance = np.minimum(abs(hue[..., None] - HUES),
                          360 - abs(hue[..., None] - HUES))
    nearest = np.argmin(distance, axis=2)
    eligible = ((highest > 60) & (delta > 55) &
                (delta / np.maximum(highest, 1) > .3) &
                (np.min(distance, axis=2) <= 30))
    return [eligible & (nearest == index) for index in range(7)]


def mask_profile(mask: np.ndarray) -> dict:
    """Visible geometry only, not predicted or hidden source topology."""
    if not mask.any():
        return dict(pixels=0, components=0, holes=0, skeletonPixels=0,
                    endpoints=0, branchpoints=0, widthMedian=0.0,
                    widthP90=0.0)
    components = int(ndi.label(mask)[1])
    holes = int(ndi.label(ndi.binary_fill_holes(mask) & ~mask)[1])
    skeleton, inward_distance = medial_axis(
        mask, return_distance=True, rng=np.random.default_rng(0))
    # Eight-neighbour skeleton degree is an observational diagnostic, not an
    # inferred author-drawn node graph. Thin aliasing can create branches.
    neighbours = ndi.convolve(
        skeleton.astype(np.int16), np.ones((3, 3), dtype=np.int16),
        mode="constant", cval=0) - skeleton.astype(np.int16)
    widths = 2 * inward_distance[skeleton]
    return dict(
        pixels=int(mask.sum()), components=components, holes=holes,
        skeletonPixels=int(skeleton.sum()),
        endpoints=int((skeleton & (neighbours == 1)).sum()),
        branchpoints=int((skeleton & (neighbours >= 3)).sum()),
        widthMedian=float(np.median(widths)),
        widthP90=float(np.quantile(widths, .9)))


def compare_masks(source: np.ndarray, fitted: np.ndarray) -> dict:
    a, b = int(source.sum()), int(fitted.sum())
    intersection = int((source & fitted).sum())
    union = int((source | fitted).sum())
    source_edge = source & ~ndi.binary_erosion(source)
    fit_edge = fitted & ~ndi.binary_erosion(fitted)
    if source_edge.any() and fit_edge.any():
        to_source = ndi.distance_transform_edt(~source_edge)
        to_fit = ndi.distance_transform_edt(~fit_edge)
        chamfer = float((to_fit[source_edge].mean() +
                         to_source[fit_edge].mean()) / 2)
    else:
        chamfer = None  # Missing pigment is not a measurable edge alignment.
    return dict(dice=2 * intersection / max(1, a + b),
                iou=intersection / max(1, union),
                boundaryChamferPx=chamfer)


def diagnose(source: str | Path, fitted: str | Path,
             width: int = DEFAULT_WIDTH, height: int = DEFAULT_HEIGHT) -> dict:
    observed = seven_masks(source, width, height)
    reconstructed = seven_masks(fitted, width, height)
    rows = []
    for index, (a, b) in enumerate(zip(observed, reconstructed)):
        rows.append(dict(hue=int(HUES[index]), source=mask_profile(a),
                         fit=mask_profile(b), **compare_masks(a, b)))
    ink_a = np.logical_or.reduce(observed)
    ink_b = np.logical_or.reduce(reconstructed)
    chamfers = [row["boundaryChamferPx"] for row in rows
                if row["boundaryChamferPx"] is not None]
    return dict(
        schema="roygbiv-optin-morphology-v1",
        source=str(source), fit=str(fitted),
        analysisSize=[width, height],
        rainbow=compare_masks(ink_a, ink_b),
        blackNegativeSpace=compare_masks(~ink_a, ~ink_b),
        meanHueDice=float(np.mean([row["dice"] for row in rows])),
        meanBoundaryChamferPx=float(np.mean(chamfers)) if chamfers else None,
        hues=rows,
        limitations=[
            "Independent approximate HSV masks are not the browser importer",
            "Morphological branches/holes are observed pixels, not hidden painter order",
            "Original artwork, seeds and any source metadata are never recovered",
        ])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--fit", required=True, type=Path)
    parser.add_argument("--width", type=int, default=DEFAULT_WIDTH)
    parser.add_argument("--height", type=int, default=DEFAULT_HEIGHT)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args(argv)
    answer = diagnose(args.source, args.fit, args.width, args.height)
    result = json.dumps(answer, indent=2, allow_nan=False) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(result, encoding="utf-8")
    else:
        sys.stdout.write(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
