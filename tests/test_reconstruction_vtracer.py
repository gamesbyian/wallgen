#!/usr/bin/env python3
"""Opt-in VTracer comparison contract; no external CLI needed for tests."""
import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location(
    'vector_oracle',ROOT/'scripts/benchmark-reconstruction-vtracer.py')
oracle=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(oracle)


class OfflineVectorTests(unittest.TestCase):
    def test_existing_svg_compares_source_without_rewriting_original(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);sources=root/'source';vectors=root/'vectors'
            sources.mkdir();vectors.mkdir()
            png=sources/'sample.no-metadata.png'
            img=Image.new('RGB',(80,160),'black')
            ImageDraw.Draw(img).rectangle((15,20,50,60),fill='red')
            img.save(png)
            (vectors/'sample.svg').write_text(
                '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="160">'
                '<path d="M15 20 H51 V61 H15 Z" fill="#ff0000"/></svg>')
            before=hashlib.sha256(png.read_bytes()).hexdigest()
            actual=oracle.benchmark(sources,root/'out',existing_svg_dir=vectors)
            self.assertEqual(actual[0]['svgPathCount'],1)
            self.assertEqual(actual[0]['brightForegroundIoU'],1.0)
            self.assertEqual(actual[0]['rasterMeanAbsoluteRgb'],0.0)
            self.assertEqual(before,hashlib.sha256(png.read_bytes()).hexdigest())
            self.assertTrue((root/'out'/'results.json').is_file())

    def test_external_svg_and_dtd_are_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            svg=Path(tmp)/'unsafe.svg'
            for data in ['<svg><image href="https://example.com/x.png"/></svg>',
                         '<!DOCTYPE svg [<!ENTITY x "hi">]><svg/>']:
                svg.write_text(data)
                with self.assertRaises(ValueError):
                    oracle.raster_svg(svg,(80,160))

    def test_absent_sources_or_vector_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);src=root/'source';src.mkdir()
            with self.assertRaisesRegex(ValueError,'one to 50'):
                oracle.benchmark(src,root/'out',existing_svg_dir=src)
            Image.new('RGB',(80,160),'black').save(src/'missing.no-metadata.png')
            with self.assertRaises(FileNotFoundError):
                oracle.benchmark(src,root/'out',existing_svg_dir=src)


if __name__=='__main__':
    unittest.main()
