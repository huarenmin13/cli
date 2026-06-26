# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import svg_safe_rewrite


class SvgSafeRewriteTest(unittest.TestCase):
    def test_rewrite_svg_replaces_local_effect_subtree_with_image(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            base = Path(tmpdir)
            png = base / "04-svg" / "rasterized" / "page-001" / "island-001.png"
            png.parent.mkdir(parents=True)
            png.write_bytes(b"png")
            svg = """
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns"
                 slide:role="slide" slide:contract-version="svglide-authoring-contract/v1" width="960" height="540" viewBox="0 0 960 540">
              <defs><filter id="shadow"><feDropShadow dx="2" dy="2" stdDeviation="2"/></filter></defs>
              <path id="decor" data-node-id="decor" filter="url(#shadow)" d="M10 10 L90 90" stroke="#111" fill="none"/>
            </svg>
            """

            rewritten = svg_safe_rewrite.rewrite_svg(
                svg,
                [{"id": "island-001", "kind": "local", "bbox": [10, 10, 80, 80], "source_node_ids": ["decor"], "reason": "unsupported-filter"}],
                [{"output_png": str(png)}],
                base,
            )

        self.assertIn('data-svglide-raster-island="true"', rewritten)
        self.assertIn('href="@./04-svg/rasterized/page-001/island-001.png"', rewritten)
        self.assertNotIn("<filter", rewritten)
        self.assertNotIn('filter="url(#shadow)"', rewritten)
        self.assertNotIn('id="decor"', rewritten)

    def test_rewrite_svg_fails_when_uncovered_hard_effect_remains(self) -> None:
        svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">
          <path id="decor" filter="url(#shadow)" d="M10 10 L90 90" stroke="#111"/>
        </svg>
        """

        with self.assertRaisesRegex(svg_safe_rewrite.SafeRewriteError, "unsupported attribute filter"):
            svg_safe_rewrite.rewrite_svg(svg, [], [], Path(tempfile.mkdtemp()))


if __name__ == "__main__":
    unittest.main()
