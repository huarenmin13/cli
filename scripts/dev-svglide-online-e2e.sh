#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/dev-svglide-online-e2e.sh --run <run-dir> [--skip-local]
  scripts/dev-svglide-online-e2e.sh --out <run-dir> --title <title> --topic <topic> [--agent-hook <path>]

Environment:
  SVGLIDE_CLI       CLI binary to run. Default: lark-cli
  SVGLIDE_AS        identity for Slides calls. Default: user
  SVGLIDE_AGENT_HOOK optional executable called as: hook <run-dir> <stage> <next-json>

Notes:
  The script assumes network routing, Whistle, PPE headers, and auth are already configured.
  Stage artifact authoring is intentionally delegated to SVGLIDE_AGENT_HOOK; the script owns
  CLI orchestration, publish evidence, online publish, readback, and SVG hard checks.
USAGE
}

cli="${SVGLIDE_CLI:-lark-cli}"
identity="${SVGLIDE_AS:-user}"
run_dir=""
out_dir=""
title="SVGlide Online E2E"
topic="SVGlide online publish smoke"
agent_hook="${SVGLIDE_AGENT_HOOK:-}"
skip_local=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --run)
      run_dir="${2:-}"
      shift 2
      ;;
    --out)
      out_dir="${2:-}"
      shift 2
      ;;
    --title)
      title="${2:-}"
      shift 2
      ;;
    --topic)
      topic="${2:-}"
      shift 2
      ;;
    --agent-hook)
      agent_hook="${2:-}"
      shift 2
      ;;
    --skip-local)
      skip_local=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$run_dir" ]]; then
  if [[ -z "$out_dir" ]]; then
    echo "missing --run or --out" >&2
    usage >&2
    exit 2
  fi
  run_dir="$out_dir"
  "$cli" slides +create-svglide \
    --as "$identity" \
    --action init \
    --title "$title" \
    --topic "$topic" \
    --delivery-target online_slide \
    --agent-runtime dev-e2e \
    --out "$run_dir" \
    --json
fi

mkdir -p "$run_dir/publish"

json_data_expr='(.data // .)'

if [[ "$skip_local" -eq 0 ]]; then
  for step in $(seq 1 32); do
    status_json="$run_dir/publish/dev-status-$step.json"
    "$cli" slides +create-svglide --as "$identity" --action status --run "$run_dir" --json > "$status_json"
    stage="$(jq -r "$json_data_expr.current_stage" "$status_json")"
    missing_count="$(jq "$json_data_expr.missing_outputs | length" "$status_json")"

    if [[ "$stage" == "publish_online" ]]; then
      break
    fi

    if [[ "$stage" == "validate_preview_repair" ]]; then
      "$cli" slides +create-svglide --as "$identity" --action next --run "$run_dir" --json > "$run_dir/publish/dev-next-$step.json"
      "$cli" slides +create-svglide --as "$identity" --action repair --run "$run_dir" --json > "$run_dir/publish/dev-repair-$step.json"
      "$cli" slides +create-svglide --as "$identity" --action complete --run "$run_dir" --json > "$run_dir/publish/dev-complete-$step.json"
      continue
    fi

    if [[ "$missing_count" -gt 0 ]]; then
      next_json="$run_dir/publish/dev-next-$step.json"
      "$cli" slides +create-svglide --as "$identity" --action next --run "$run_dir" --json > "$next_json"
      if [[ -z "$agent_hook" ]]; then
        echo "stage $stage is missing outputs. Set SVGLIDE_AGENT_HOOK or pass --skip-local for a completed run." >&2
        exit 3
      fi
      "$agent_hook" "$run_dir" "$stage" "$next_json"
    fi
    "$cli" slides +create-svglide --as "$identity" --action complete --run "$run_dir" --json > "$run_dir/publish/dev-complete-$step.json"
  done
fi

"$cli" slides +publish-svglide --as "$identity" --run "$run_dir" --json > "$run_dir/publish/dev-publish.json"

jq -e '.status == "passed" and .content_type == "svg" and .forbidden_format_detected == false' "$run_dir/publish/request_evidence.json" >/dev/null
jq -e '.status == "passed" and (.presentation_id | length > 0)' "$run_dir/publish/online_slide.json" >/dev/null
jq -e '.stage == "publish_online" and .status == "passed"' "$run_dir/receipts/publish_online.json" >/dev/null

presentation_id="$(jq -r '.presentation_id' "$run_dir/publish/online_slide.json")"
slide_count="$(jq -r '.slide_count' "$run_dir/publish/request_evidence.json")"

"$cli" slides xml_presentations get \
  --as "$identity" \
  --params "{\"xml_presentation_id\":\"$presentation_id\"}" \
  --json > "$run_dir/publish/readback.json"

jq -r "$json_data_expr.xml_presentation.content // \"\"" "$run_dir/publish/readback.json" > "$run_dir/publish/readback-content.xml"

svg_count="$(awk '{n+=gsub(/<svg /,"")} END {print n+0}' "$run_dir/publish/readback-content.xml")"
role_count="$(awk '{n+=gsub(/slide:role="slide"/,"")} END {print n+0}' "$run_dir/publish/readback-content.xml")"
slide_node_count="$(awk '{n+=gsub(/<slide /,"")} END {print n+0}' "$run_dir/publish/readback-content.xml")"
html_count="$(awk '{n+=gsub(/<html|<!DOCTYPE html|<!doctype html/,"")} END {print n+0}' "$run_dir/publish/readback-content.xml")"
data_image_count="$(awk '{n+=gsub(/data:image\//,"")} END {print n+0}' "$run_dir/publish/readback-content.xml")"

if [[ "$svg_count" != "$slide_count" ]]; then
  echo "readback SVG count $svg_count does not match request evidence slide_count $slide_count" >&2
  exit 4
fi
if [[ "$role_count" != "$slide_count" ]]; then
  echo "readback slide role count $role_count does not match request evidence slide_count $slide_count" >&2
  exit 4
fi
if [[ "$slide_node_count" != "0" || "$html_count" != "0" || "$data_image_count" != "0" ]]; then
  echo "readback contains forbidden fallback format: slide=$slide_node_count html=$html_count data_image=$data_image_count" >&2
  exit 4
fi

cat <<SUMMARY
SVGlide online E2E passed
run: $run_dir
presentation_id: $presentation_id
svg_count: $svg_count
readback: $run_dir/publish/readback.json
SUMMARY
