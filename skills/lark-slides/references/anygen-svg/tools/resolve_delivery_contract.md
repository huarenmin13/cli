---
id: resolve_delivery_contract
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: request_resolution
profiles:
  - local_svg_deck
  - imported_pptx
  - template_reference
exposure: runtime
order: 4
cardinality: once
requires:
  - mode_system_prompt_svg
  - svg_reference
condition: always
trigger:
  - phase_2_delivery_target_resolution
consumes:
  - request/request.json
  - request/source_manifest.json
produces:
  - request/delivery_contract.json
  - receipts/tool_calls/request_resolution/resolve_delivery_contract.json
completion_gate:
  - delivery_contract_schema_valid
  - delivery_target_not_downgraded
---

# Resolve Delivery Contract

Turn the user's delivery intent into a machine-checkable contract before research, outline, assets, or authoring.

## Non-Negotiable Rules

- Do not silently rewrite online, Feishu, shared, downloadable, real, actual, or formal delivery into a local-only preview.
- If the user requests online slide delivery and the current runtime cannot publish online, the run must end as `blocked`, not `ready`.
- If the user requests real, actual, beautiful, visually impactful, paper, report, company, brand, person, place, event, or product content, decide whether real images/evidence screenshots are required before the asset stage.
- Only set `delivery_target=local_preview` when the user explicitly asks for local preview or does not ask for online delivery.
- Only set `requires_real_images=false` for chart-only/vector-only/no-image requests or genuinely abstract topics with a written reason.

## Output

Write `request/delivery_contract.json`:

```json
{
  "prompt_contract": {},
  "delivery_contract": {
    "delivery_target": "local_preview",
    "requires_online_slide": false,
    "requires_local_preview": true,
    "requires_real_images": true,
    "reason": "resolved from explicit delivery target and request text",
    "detected_signals": ["真实", "图片"]
  }
}
```

`delivery_target` must be one of:

- `local_preview`
- `online_slide`
- `both`

The final `receipts/delivery.json.status` is allowed to be `ready` only when the evidence satisfies this contract.
