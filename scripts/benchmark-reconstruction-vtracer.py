#!/usr/bin/env python3
"""Opt-in VTracer-vs-source visual benchmark. No canonical recipe inference.

Requires an independent trusted VTracer binary and the separately pinned
optional Python packages. Reads immutable metadata-free source PNGs.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
from pathlib import Path
import subprocess
import time
import xml.etree.ElementTree as ET
import cairosvg
import numpy as np
from PIL import Image

MAX_PIXELS = 650_000
MAX_SAMPLES = 50


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def raster_svg(svg: Path, size: tuple[int, int]) -> Image.Image:
    # Only use trusted locally generated vector oracle outputs. Never fetch
    # external SVG references or untrusted embedded images/DTD declarations.
    source = svg.read_bytes()
    if len(source) > 8_000_000 or any(token in source.lower() for token in
            (b'<!doctype', b'<!entity', b'<image', b'url(',
             b'xlink:href=', b' href=')):
        raise ValueError('Untrusted/unsupported SVG dependency or size')
    data = cairosvg.svg2png(bytestring=source, output_width=size[0],
                            output_height=size[1])
    rgba = Image.open(io.BytesIO(data)).convert('RGBA')
    flattened = Image.new('RGBA', rgba.size, (0, 0, 0, 255))
    flattened.alpha_composite(rgba)
    return flattened.convert('RGB')


def compare_one(source: Path, vector: Path, preview: Path) -> dict:
    with Image.open(source) as img:
        if img.width < 24 or img.height < 24 or img.width*img.height > MAX_PIXELS:
            raise ValueError('Out-of-bounds original source image')
        size = img.size
        original = np.asarray(img.convert('RGB'), dtype=np.float32)
    raw = vector.read_bytes()
    tree = ET.fromstring(raw)
    paths = [element for element in tree.iter()
             if element.tag.rsplit('}', 1)[-1] == 'path']
    if not paths:
        raise ValueError('Vector result contains no SVG path geometry')
    reconstructed = raster_svg(vector, size)
    preview.parent.mkdir(parents=True, exist_ok=True)
    reconstructed.save(preview)
    fitted = np.asarray(reconstructed, dtype=np.float32)
    if original.shape != fitted.shape:
        raise ValueError('Unexpected vector raster dimensions')
    original_foreground = original.max(axis=2) > 50
    fitted_foreground = fitted.max(axis=2) > 50
    union = int(np.logical_or(original_foreground, fitted_foreground).sum())
    intersection = int(np.logical_and(original_foreground,
                                      fitted_foreground).sum())
    path_data = [element.attrib.get('d', '') for element in paths]
    return dict(sourceSha256=sha256(source),
                vectorSha256=hashlib.sha256(raw).hexdigest(),
                sourceWidth=size[0], sourceHeight=size[1],
                rasterMeanAbsoluteRgb=float(np.abs(original-fitted).mean()/255),
                brightForegroundIoU=intersection/max(1, union),
                svgBytes=len(raw), svgPathCount=len(paths),
                svgPathDataChars=sum(map(len, path_data)),
                largestSvgPathDataChars=max(map(len, path_data)),
                sourceKind='trusted-existing-current-renderer-PNG',
                status='SVG-appearance-reference-not-editable-canonical-recipe')


def benchmark(source_dir: Path, out_dir: Path, *, binary: str='vtracer',
              existing_svg_dir: Path | None=None) -> list[dict]:
    sources = sorted(source_dir.glob('*.no-metadata.png'))
    if not sources or len(sources)>MAX_SAMPLES:
        raise ValueError('Expected one to 50 existing metadata-free source PNGs')
    out_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for source in sources:
        name = source.name.removesuffix('.no-metadata.png')
        svg = ((existing_svg_dir if existing_svg_dir else out_dir)
               / f'{name}.svg')
        start = time.perf_counter()
        if existing_svg_dir is None:
            completed = subprocess.run([binary, str(source), str(svg)],
                text=True, capture_output=True, timeout=90, check=False)
            if completed.returncode:
                raise RuntimeError(f'Vector oracle failed: {completed.stderr[:700]}')
        if not svg.is_file():
            raise FileNotFoundError(f'Missing trusted vector oracle: {name}')
        row = compare_one(source, svg, out_dir / f'{name}.oracle.png')
        row.update(case=name, elapsedSeconds=round(time.perf_counter()-start,4))
        print('VTRACER_ORACLE '+json.dumps(row,sort_keys=True),flush=True)
        results.append(row)
    (out_dir/'results.json').write_text(json.dumps(dict(
        schema='roygbiv-independent-vector-oracle-v1',
        blackBackgroundAssumed=True,
        vectorizer='independently pinned external VTracer binary',
        caveat='No original seed, editability, paint order or browser adoption',
        results=results),indent=2)+'\n',encoding='utf-8')
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir',required=True,type=Path)
    parser.add_argument('--out-dir',required=True,type=Path)
    parser.add_argument('--binary',default='vtracer')
    parser.add_argument('--existing-svg-dir',type=Path,
                        help='Trusted earlier VTracer output, without invoking binary')
    args=parser.parse_args()
    benchmark(args.source_dir,args.out_dir,binary=args.binary,
              existing_svg_dir=args.existing_svg_dir)


if __name__ == '__main__':
    main()
