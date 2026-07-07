#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

production_paths=(
  "shortcuts"
  "internal"
  "skills"
)

forbidden_pattern='ppe_svg_slides|Env=Pre_release|x-use-ppe|x-tt-env|whistle|Whistle|w2 restart|w2 add|open\.feishu-pre\.cn|accounts\.feishu-pre\.cn'
allowlist_globs=(
  "!skills/lark-slides/references/svglide-online-publish-prelaunch-cleanup-checklist.md"
)

existing_paths=()
for path in "${production_paths[@]}"; do
  if [[ -e "$path" ]]; then
    existing_paths+=("$path")
  fi
done

if [[ "${#existing_paths[@]}" -eq 0 ]]; then
  echo "No production paths found to scan." >&2
  exit 2
fi

if rg -n "${allowlist_globs[@]/#/--glob=}" "$forbidden_pattern" "${existing_paths[@]}"; then
  cat >&2 <<'MSG'

SVGlide prelaunch cleanup failed.
Production paths contain PPE / Whistle / pre-release routing tokens.

Keep the raw SVG publish contract, but move PPE routing into dev-only harnesses
or replace it with the production publisher before release.
MSG
  exit 1
fi

echo "SVGlide prelaunch cleanup check passed: no PPE routing tokens in production paths."
