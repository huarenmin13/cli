# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import svg_raster_renderer


MINIMAL_PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff\x89\x99=\x1d\x00\x00\x00\x00IEND\xaeB`\x82"


class StubRenderer:
    def render_full_page(self, svg: str, output_png: Path, scale: int) -> dict[str, object]:
        output_png.parent.mkdir(parents=True, exist_ok=True)
        output_png.write_bytes(MINIMAL_PNG)
        return {"output_png": str(output_png), "bbox": [0.0, 0.0, 960.0, 540.0], "scale": scale, "bytes": output_png.stat().st_size, "render_ms": 1, "alpha_crop": False}

    def render_region(self, svg: str, output_png: Path, scale: int, bbox: list[float]) -> dict[str, object]:
        output_png.parent.mkdir(parents=True, exist_ok=True)
        output_png.write_bytes(MINIMAL_PNG)
        return {"output_png": str(output_png), "bbox": bbox, "scale": scale, "bytes": output_png.stat().st_size, "render_ms": 1, "alpha_crop": False}


class SvgRasterRendererTest(unittest.TestCase):
    def test_render_islands_outputs_local_png_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            asset_dir = Path(tmpdir) / "rasterized"
            rendered = svg_raster_renderer.render_islands(
                '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"/>',
                [
                    {
                        "id": "island-001",
                        "kind": "local",
                        "bbox": [120.0, 80.0, 240.0, 90.0],
                        "reason": "unsupported-filter",
                        "source_node_ids": ["shadow-path"],
                    }
                ],
                asset_dir,
                2,
                StubRenderer(),
            )

        self.assertEqual(rendered[0]["bbox"], [120.0, 80.0, 240.0, 90.0])
        self.assertEqual(rendered[0]["kind"], "local")
        self.assertEqual(rendered[0]["reason"], "unsupported-filter")
        self.assertEqual(rendered[0]["source_node_ids"], ["shadow-path"])
        self.assertTrue(str(rendered[0]["output_png"]).endswith("island-001.png"))


if __name__ == "__main__":
    unittest.main()
