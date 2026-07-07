---
id: publish_online
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: publish_online
profiles:
  - local_svg_deck
  - imported_pptx
  - template_reference
exposure: runtime
order: 90
cardinality: once
requires:
  - mode_system_prompt_svg
  - svg_reference
condition: always
trigger:
  - delivery_target_online_slide_or_both
consumes:
  - slides/*.svg
  - receipts/delivery.json
produces:
  - publish/request_evidence.json
  - publish/online_slide.json
  - receipts/publish_online.json
completion_gate:
  - svg_publish_request_evidence_passed
  - online_slide_delivery_status_recorded
---

# Publish Online

Use this stage only when `request/delivery_contract.json.delivery_contract.delivery_target` is `online_slide` or `both`.

## Rules

- Online publishing has one fixed CLI entrypoint: `lark-cli slides +publish-svglide --as user --run <run-dir>`.
- `slides +create-svglide` remains the local generation and gate entrypoint. `slides +create-svglide --action publish` may exercise the local publish gate, but without a real publisher it must only return `blocked`.
- Do not claim online delivery from `preview.html`, local screenshots, a PDF file, or a local HTML upload.
- Do not fabricate `presentation_id`, Feishu URL, or PDF download URL.
- Before calling any online publisher, the CLI must write `publish/request_evidence.json` and it must prove every request payload slide is raw `<svg>` content. Slides XML, SXSD, HTML, screenshots, data URLs, or raster fallback must fail closed.
- If no real Lark Slides publisher is configured, write a blocked report with `blocked_reason_code=svglide.publish_online.missing_publisher`.
- `receipts/delivery.json.status` must remain `blocked` until `publish/online_slide.json.status=passed`.
- A successful URL is not sufficient proof. The publisher or e2e harness must read back the presentation content and verify the returned content still contains the same number of `<svg ... slide:role="slide">` payloads and does not contain `<slide `, HTML, or `data:image` fallback content.

## Output

Write `publish/request_evidence.json` and `publish/online_slide.json`:

```json
{
  "status": "blocked",
  "slide_count": 0,
  "publisher": "missing",
  "blocked_reason_code": "svglide.publish_online.missing_publisher",
  "message": "online slide delivery was requested, but no Lark Slides publisher is configured"
}
```

When a real publisher is available, the passed form must include a real presentation id and URL returned by that publisher.
