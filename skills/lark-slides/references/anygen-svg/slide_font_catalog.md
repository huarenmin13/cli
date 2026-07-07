---
id: slide_font_catalog
role: runtime_binding
invocation: reference
profiles:
  - local_svg_deck
exposure: runtime
---

# Slide Font Catalog Binding

SVGlide output is intended to survive online Slide creation. Do not invent CSS font stacks. Use canonical Slide `font_family` values.

Authoritative runtime files:

- `internal/svglide/font_catalog/slide_supported_fonts.json`: full canonical Slide font list.
- `internal/svglide/font_catalog/slide_font_theme_presets.json`: mood presets and role-level candidate pools.
- `internal/svglide/font_catalog/slide_font_tags.json`: first-pass font tags for future sample review.

## Required typography contract fields

`brief/typography_contract.json` must include:

- `font_source: "slide_font_theme_presets"`
- `selected_moods`: one or more preset names below
- `roles.display.family`, `roles.body.family`, `roles.number.family`, `roles.label.family`

Each `family` must be exactly one canonical Slide `font_family`. Do not write comma-separated CSS stacks such as `Inter, Arial, sans-serif`.

## Preset selection rule

Choose 1-3 moods by topic and audience, then choose role fonts from the union of those mood candidate pools.

Examples:

- Middle-school Beethoven appreciation class: `education_readable + luxury_editorial`
- NVIDIA financial report: `finance_institutional + tech_ai_precision`
- Haaland / World Cup sports story: `sports_broadcast + youth_pop`
- Chinese tea: `culture_heritage + calligraphy_poetic + warm_lifestyle`

## Mood presets

### `corporate_neutral`
- display: `Montserrat`, `Inter`, `Lato`, `Noto Sans SC`, `SimHei`
- body: `Inter`, `Lato`, `Open Sans`, `Noto Sans SC`, `Arial`
- number: `Roboto Mono`, `Inconsolata`, `Source Code Pro`, `Roboto`
- label: `Inter`, `Roboto`, `Noto Sans SC`, `Arial`

### `finance_institutional`
- display: `IBM Plex Sans`, `Montserrat`, `Libre Franklin`, `Noto Sans SC`, `SimHei`
- body: `IBM Plex Sans`, `Inter`, `Roboto`, `Noto Sans SC`
- number: `Roboto Mono`, `Source Code Pro`, `Inconsolata`
- label: `IBM Plex Sans`, `Roboto Condensed`, `Noto Sans SC`

### `tech_ai_precision`
- display: `Exo 2`, `Rajdhani SemiBold`, `Titillium Web SemiBold`, `LogoSC Unbounded Sans`, `ChillDINGothic SemiBold`
- body: `IBM Plex Sans`, `Inter`, `Roboto`, `Noto Sans SC`
- number: `Roboto Mono`, `Source Code Pro`, `Inconsolata`
- label: `Rajdhani SemiBold`, `Roboto Condensed`, `Noto Sans SC`

### `data_scientific`
- display: `IBM Plex Sans`, `Source Code Pro`, `Roboto Slab`, `Noto Serif SC`
- body: `IBM Plex Sans`, `Noto Sans`, `Noto Sans SC`, `Open Sans`
- number: `Source Code Pro`, `Roboto Mono`, `Inconsolata`
- label: `IBM Plex Sans`, `Noto Sans`, `Noto Sans SC`

### `luxury_editorial`
- display: `Playfair Display`, `EB Garamond`, `Libre Baskerville`, `ChillJinshuSongMedium`, `Songti SC`
- body: `Lora`, `Libre Baskerville`, `Noto Serif SC`, `Songti SC`, `Alegreya`
- number: `Montserrat`, `Lato`, `Roboto`
- label: `Josefin Sans`, `Montserrat`, `ChillDINGothic SemiBold`, `Noto Sans SC`

### `fashion_high_contrast`
- display: `Abril Fatface`, `Playfair Display`, `Bebas Neue`, `Poiret One`, `ChillJinshuSongMedium`
- body: `Raleway`, `Lato`, `Lora`, `Noto Serif SC`
- number: `Bebas Neue`, `Montserrat`, `Roboto Condensed`
- label: `Raleway`, `Josefin Sans`, `Montserrat`

### `culture_heritage`
- display: `ChillJinshuSongMedium`, `Noto Serif SC`, `Songti SC`, `ZCOOL XiaoWei`, `Kaiti SC`
- body: `Noto Serif SC`, `Songti SC`, `Noto Sans SC`
- number: `Noto Sans SC`, `SimHei`, `Roboto`
- label: `ChillDuanHeiSong_CompactRegular`, `Noto Sans SC`, `Songti SC`

### `calligraphy_poetic`
- display: `Ma Shan Zheng`, `Liu Jian Mao Cao`, `Long Cang`, `Zhi Mang Xing`, `Kaiti SC`
- body: `Noto Serif SC`, `Songti SC`, `Kaiti SC`
- number: `Noto Sans SC`, `SimHei`
- label: `Kaiti SC`, `Songti SC`, `Noto Sans SC`

### `sports_broadcast`
- display: `Anton`, `Bebas Neue`, `Oswald`, `Teko`, `Fjalla One`
- body: `Barlow Condensed`, `Roboto Condensed`, `Noto Sans SC`, `ChillDuanSans WideSemiBold`
- number: `Anton`, `Bebas Neue`, `Teko`, `Roboto Condensed`
- label: `Oswald`, `Barlow Condensed`, `ChillDuanSans WideSemiBold`

### `youth_pop`
- display: `DouyinSans`, `ZCOOL KuaiLe`, `Righteous`, `Comfortaa`, `ChillRoundF`
- body: `Nunito Sans`, `Quicksand`, `Noto Sans SC`, `Resource Han Rounded CN`
- number: `DouyinSans`, `Montserrat`, `Roboto`
- label: `DouyinSans`, `Comfortaa`, `Resource Han Rounded CN`

### `warm_lifestyle`
- display: `Quicksand`, `Nunito`, `Lora`, `975Maru SC`, `Resource Han Rounded CN`
- body: `Nunito Sans`, `Lora`, `Noto Sans SC`, `Songti SC`
- number: `Nunito Sans`, `Roboto`, `Montserrat`
- label: `Quicksand`, `Nunito Sans`, `Resource Han Rounded CN`

### `education_readable`
- display: `Nunito Sans`, `Source Code Pro`, `Noto Sans SC`, `SimHei`
- body: `Noto Sans SC`, `Open Sans`, `Roboto`, `Arial`
- number: `Roboto Mono`, `Roboto`, `Source Code Pro`
- label: `Noto Sans SC`, `Roboto`, `Arial`

### `government_formal`
- display: `Songti SC Black`, `Noto Serif SC`, `SimHei`
- body: `Songti SC`, `Noto Serif SC`, `Noto Sans SC`
- number: `SimHei`, `Noto Sans SC`, `Roboto`
- label: `SimHei`, `Noto Sans SC`, `Songti SC`

### `medical_clean`
- display: `IBM Plex Sans`, `Lato`, `Noto Sans SC`, `Source Code Pro`
- body: `IBM Plex Sans`, `Open Sans`, `Noto Sans SC`, `Roboto`
- number: `Roboto Mono`, `Source Code Pro`, `Roboto`
- label: `IBM Plex Sans`, `Noto Sans SC`, `Roboto`

### `industrial_engineering`
- display: `Barlow Condensed`, `Archivo Narrow`, `Roboto Condensed`, `ChillDuanSans WideSemiBold`
- body: `Barlow`, `Roboto`, `Noto Sans SC`, `ChillReunion_Sans`
- number: `Roboto Mono`, `Teko`, `Source Code Pro`
- label: `Archivo Narrow`, `Roboto Condensed`, `ChillDINGothic SemiBold`

### `startup_product`
- display: `Poppins`, `Montserrat`, `DM Sans 9pt`, `DouyinSans`, `Noto Sans SC`
- body: `DM Sans 9pt`, `Inter`, `Noto Sans SC`, `Open Sans`
- number: `Roboto Mono`, `DM Sans 9pt`, `Montserrat`
- label: `DM Sans 9pt`, `Inter`, `Noto Sans SC`

### `gaming_sci_fi`
- display: `Exo`, `Exo 2`, `Play`, `Rajdhani SemiBold`, `LogoSC Unbounded Sans`
- body: `Exo 2`, `Rajdhani SemiBold`, `Noto Sans SC`, `Roboto`
- number: `Rajdhani SemiBold`, `Roboto Mono`, `Teko`
- label: `Exo 2`, `Rajdhani SemiBold`, `LogoSC Unbounded Sans`
