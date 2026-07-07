# SVGlide Online Publish Prelaunch Cleanup Checklist

目的：防止 `ppe_svg_slides` 实验链路被误带到真实上线代码。上线前要移除实验壳，保留 raw SVG 发布契约。

## 必须保留

- `slides +create-svglide` 本地完整链路入口。
- `slides +publish-svglide` 线上发布入口。
- raw `<svg ... slide:role="slide">` payload 证据。
- 本地图片发布前上传并替换为 `file_token`。
- 非 `<svg>` payload fail closed。
- `publish/request_evidence.json`、`publish/online_slide.json`、`receipts/publish_online.json`。
- readback 校验：线上内容仍包含 `<svg ... slide:role="slide">`。

## 上线前必须移除或隔离

`SVGLIDE_PRELAUNCH_REMOVE_PPE`

- `ppe_svg_slides`
- `Env=Pre_release`
- `x-use-ppe=1`
- `x-tt-env=ppe_svg_slides`
- Whistle / `w2` 代理依赖
- 写死 PPE rule 文件
- dev-only smoke/live e2e 参数
- 临时 output 样例、手工 patch、固定 presentation id / URL

## 检查命令

生产路径硬检查：

```bash
scripts/check-svglide-prelaunch-cleanup.sh
```

定位清理标记：

```bash
rg "SVGLIDE_PRELAUNCH_REMOVE_PPE" skills scripts docs/current
```

## 判定规则

- 生产路径中出现 PPE/header/proxy 词：阻断上线。
- dev-only 脚本可以存在，但必须带 `SVGLIDE_PRELAUNCH_REMOVE_PPE` 标记。
- 本清单是 `skills/` 下唯一允许记录 PPE/header/proxy 词的文档。
- 文档可以记录 PPE 词，但必须明确它们是上线前移除项。
- 如果正式环境已支持 raw SVG parser，只替换 publisher endpoint/header 适配层，不移除 raw SVG evidence/readback 契约。
