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

    def test_trusted_external_primitive_only_svg_is_measured_and_labelled(self):
        # Open Vectorizer can emit a proper circle/ellipse/rect with NO <path>.
        # Previously this was incorrectly rejected as "no geometry".
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);sources=root/'source';vectors=root/'vectors'
            sources.mkdir();vectors.mkdir()
            png=sources/'native-primitives.no-metadata.png'
            img=Image.new('RGB',(80,160),'black')
            draw=ImageDraw.Draw(img)
            draw.rectangle((10,10,26,33),fill='#ff0000')
            draw.ellipse((40,21,64,45),fill='#ffff00')
            draw.ellipse((22,86,58,102),fill='#00ff00')
            img.save(png)
            (vectors/'native-primitives.svg').write_text(
                '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="160">'
                '<g><rect x="10" y="10" width="17" height="24" fill="#ff0000"/>'
                '<circle cx="52" cy="33" r="12" fill="#ffff00"/>'
                '<ellipse cx="40" cy="94" rx="18" ry="8" fill="#00ff00"/>'
                '</g></svg>')
            original=png.read_bytes()
            result=oracle.benchmark(sources,root/'out',existing_svg_dir=vectors,
                                    oracle_name='Open Vectorizer pinned local')
            row=result[0]
            self.assertEqual(row['svgPathCount'],0)
            self.assertEqual(row['svgPrimitiveCount'],3)
            self.assertEqual(row['svgShapeElementCount'],3)
            self.assertEqual(row['svgShapeCounts'],
                             {'rect':1,'circle':1,'ellipse':1})
            self.assertGreater(row['brightForegroundIoU'],.85)
            self.assertLess(row['rasterMeanAbsoluteRgb'],.02)
            self.assertEqual(png.read_bytes(),original)
            import json
            report=json.loads((root/'out'/'results.json').read_text())
            self.assertEqual(report['vectorizer'],
                             'trusted existing SVG: Open Vectorizer pinned local')

    def test_explicit_shape_whitelist_and_geometry_reporting(self):
        shapes=(
            b'<svg xmlns="http://www.w3.org/2000/svg">'
            b'<g><line x1="0" y1="0" x2="2" y2="2"/>'
            b'<polyline points="1,1 3,3"/><polygon points="0,0 3,0 3,3"/>'
            b'<path d="M0 0 L1 1"/></g></svg>'
        )
        measured=oracle.inspect_svg_geometry(shapes)
        self.assertEqual(measured['svgShapeElementCount'],4)
        self.assertEqual(measured['svgPrimitiveCount'],3)
        self.assertEqual(measured['svgPathCount'],1)
        self.assertEqual(measured['svgPathDataChars'],len('M0 0 L1 1'))
        with self.assertRaisesRegex(ValueError,'no SVG shape'):
            oracle.inspect_svg_geometry(b'<svg/>')
        with self.assertRaisesRegex(ValueError,'Invalid vector oracle name'):
            oracle.benchmark(Path('/missing'),Path('/out'),
                             oracle_name='../../../../invalid')

    def test_external_svg_and_dtd_are_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            svg=Path(tmp)/'unsafe.svg'
            for data in ['<svg><image href="https://example.com/x.png"/></svg>',
                         '<!DOCTYPE svg [<!ENTITY x "hi">]><svg/>',
                         '<svg><script>evil()</script><circle r="2"/></svg>',
                         '<svg><foreignObject/></svg>',
                         '<svg><use href="#x"/></svg>',
                         '<svg><circle r="2" onload="evil()"/></svg>',
                         '<svg><rect style="fill:url(https://x)"/></svg>']:
                svg.write_text(data)
                with self.assertRaises(ValueError):
                    oracle.raster_svg(svg,(80,160))
                source=Path(tmp)/'source.png'
                Image.new('RGB',(80,160),'black').save(source)
                with self.assertRaises(ValueError):
                    oracle.compare_one(source,svg,Path(tmp)/'unsafe.png')

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
