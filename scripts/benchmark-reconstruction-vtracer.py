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
import re
from pathlib import Path
import subprocess
import time
import xml.etree.ElementTree as ET
import cairosvg
import numpy as np
from PIL import Image

MAX_PIXELS = 650_000
MAX_SAMPLES = 50
# Offline comparison only accepts self-contained flat geometry, never a
# general SVG runtime with links, scripts, external assets or URL lookups.
SHAPE_TAGS = ('path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon')
SAFE_TAGS = frozenset(('svg', 'g', 'title', 'desc', *SHAPE_TAGS))


def inspect_svg_geometry(source: bytes) -> dict:
    if len(source) > 8_000_000 or any(token in source.lower() for token in
            (b'<!doctype', b'<!entity', b'<?xml-stylesheet', b'<image',
             b'url(', b'@import', b'xlink:href=', b' href=',
             b'javascript:', b'data:')):
        raise ValueError('Untrusted/unsupported SVG dependency or size')
    tree = ET.fromstring(source)
    if tree.tag.rsplit('}', 1)[-1] != 'svg':
        raise ValueError('Expected an SVG document')
    counts = dict.fromkeys(SHAPE_TAGS, 0)
    path_data = []
    element_count = 0
    for element in tree.iter():
        element_count += 1
        if element_count > 8192:
            raise ValueError('Excessive SVG element count')
        tag = element.tag.rsplit('}', 1)[-1]
        if tag not in SAFE_TAGS:
            raise ValueError('Unsupported SVG element: ' + tag)
        for name, value in element.attrib.items():
            local_name = name.rsplit('}', 1)[-1].lower()
            if local_name.startswith('on') or local_name in ('href', 'src'):
                raise ValueError('Unsafe SVG attribute: ' + local_name)
            # ElementTree expands numeric XML escapes before CairoSVG does.
            # Inspect the decoded value, not only raw source bytes, to reject
            # an obfuscated CSS url() / external dependency.
            lowered = value.lower()
            if any(token in lowered for token in
                   ('url(', '@import', 'javascript:', 'data:')):
                raise ValueError('Unsafe SVG attribute value: ' + local_name)
        if tag in counts:
            counts[tag] += 1
            if tag == 'path':
                path_data.append(element.attrib.get('d', ''))
    shape_count = sum(counts.values())
    if not shape_count:
        raise ValueError('Vector result contains no SVG shape geometry')
    return dict(svgPathCount=counts['path'],
                svgPrimitiveCount=shape_count-counts['path'],
                svgShapeElementCount=shape_count,
                svgShapeCounts={name: value for name, value in counts.items() if value},
                svgPathDataChars=sum(map(len, path_data)),
                largestSvgPathDataChars=max(map(len, path_data), default=0))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def raster_svg(svg: Path, size: tuple[int, int],
               *, include_geometry: bool=False):
    # Reject unsupported/self-fetching/active SVG before CairoSVG sees input.
    # A compact vectorizer may return primitive elements with zero paths.
    source = svg.read_bytes()
    geometry = inspect_svg_geometry(source)
    data = cairosvg.svg2png(bytestring=source, output_width=size[0],
                            output_height=size[1])
    rgba = Image.open(io.BytesIO(data)).convert('RGBA')
    flattened = Image.new('RGBA', rgba.size, (0, 0, 0, 255))
    flattened.alpha_composite(rgba)
    result = flattened.convert('RGB')
    return (result, geometry) if include_geometry else result


def compare_one(source: Path, vector: Path, preview: Path) -> dict:
    with Image.open(source) as img:
        if img.width < 24 or img.height < 24 or img.width*img.height > MAX_PIXELS:
            raise ValueError('Out-of-bounds original source image')
        size = img.size
        original = np.asarray(img.convert('RGB'), dtype=np.float32)
    # Apply the conservative SVG dependency/size check before XML parsing:
    # the independent oracle must not parse unbounded entity expansions.
    reconstructed, geometry = raster_svg(vector, size, include_geometry=True)
    raw = vector.read_bytes()
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
    return dict(sourceSha256=sha256(source),
                vectorSha256=hashlib.sha256(raw).hexdigest(),
                sourceWidth=size[0], sourceHeight=size[1],
                rasterMeanAbsoluteRgb=float(np.abs(original-fitted).mean()/255),
                brightForegroundIoU=intersection/max(1, union),
                svgBytes=len(raw), **geometry,
                sourceKind='trusted-existing-metadata-free-PNG',
                status='SVG-appearance-reference-not-editable-canonical-recipe')


def benchmark(source_dir: Path, out_dir: Path, *, binary: str='vtracer',
              existing_svg_dir: Path | None=None,
              oracle_name: str='external SVG vectorizer') -> list[dict]:
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9 ._+/#():-]{0,79}', oracle_name):
        raise ValueError('Invalid vector oracle name')
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
        print(('VECTOR_ORACLE ' if existing_svg_dir else 'VTRACER_ORACLE ')+
              json.dumps(row,sort_keys=True),flush=True)
        results.append(row)
    (out_dir/'results.json').write_text(json.dumps(dict(
        schema='roygbiv-independent-vector-oracle-v1',
        blackBackgroundAssumed=True,
        vectorizer=('trusted existing SVG: '+oracle_name if existing_svg_dir
                    else 'independently pinned external VTracer binary'),
        caveat='No original seed, editability, paint order or browser adoption',
        results=results),indent=2)+'\n',encoding='utf-8')
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir',required=True,type=Path)
    parser.add_argument('--out-dir',required=True,type=Path)
    parser.add_argument('--binary',default='vtracer')
    parser.add_argument('--existing-svg-dir',type=Path,
                        help='Trusted local SVG output from an independently pinned vectorizer')
    parser.add_argument('--oracle-name',default='external SVG vectorizer',
                        help='Label external trusted SVG outputs accurately')
    args=parser.parse_args()
    benchmark(args.source_dir,args.out_dir,binary=args.binary,
              existing_svg_dir=args.existing_svg_dir,
              oracle_name=args.oracle_name)


if __name__ == '__main__':
    main()
