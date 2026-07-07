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
  - publish/online_slide.json
  - receipts/publish_online.json
completion_gate:
  - online_slide_delivery_status_recorded
---

# Publish Online

Use this stage only when `request/delivery_contract.json.delivery_contract.delivery_target` is `online_slide` or `both`.

## Rules

- Do not claim online delivery from `preview.html`, local screenshots, a PDF file, or a local HTML upload.
- Do not fabricate `presentation_id`, Feishu URL, or PDF download URL.
- If no real Lark Slides publisher is configured, write a blocked report with `blocked_reason_code=svglide.publish_online.missing_publisher`.
- `receipts/delivery.json.status` must remain `blocked` until `publish/online_slide.json.status=passed`.

## Output

Write `publish/online_slide.json`:

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
