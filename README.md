# AutoDrop

Figma plugin that fills a designed backdrop template with session and speaker data from the
[events.startupmission.in](https://events.startupmission.in) agenda API.

## Setup

```bash
npm install
npm run build      # or: npm run dev (rebuilds on change)
```

In the Figma desktop app: **Plugins → Development → Import plugin from manifest…** and pick `manifest.json`.

## Usage

1. Select your template frame on the canvas (or click **New template** to create a starter one; it is selected for you).
2. Pick an **Event** and click **Load**.
3. Pick a **Date** and **Venue**, then a **Session** to preview it.
4. **Generate** makes one backdrop for the selected session. **Generate all (N)** makes one per session in that venue, laid out in a 10-column grid.

Generated frames appear to the right of the template and are named after the session.

## Template naming rules

```
Template frame                ← the frame you select
├── "#category"               ← text layers: placeholders are replaced with session data
├── "#name"
└── @layout                   ← frame/group holding the speaker cards (use auto layout so cards flow)
    └── @speaker              ← one card; cloned once per speaker, then the original is removed
        ├── #photo            ← rectangle/ellipse/frame with an image fill → speaker photo
        ├── "#name"
        ├── "#designation"
        └── "#organisation"
```

### Layers matched by name

| Layer name | Where | What happens |
| --- | --- | --- |
| `@layout` | anywhere inside the template | Container the speaker cards are added to. Must be a frame or group. |
| `@speaker` | inside `@layout` | The card design. Cloned for each speaker, in agenda order. |
| `#<field>` on an image layer | inside `@speaker` | If the layer is a rectangle, ellipse or frame **that already has an image fill**, the fill is replaced with the speaker's `<field>` URL (normally `#photo`). |

Layer names are matched ignoring spaces and invisible characters. `@layout` and `@speaker` are required; if one
is missing the plugin shows an error listing the layer names it found.

### Text placeholders

Placeholders go in the **text content** (not the layer name). Every `#<field>` in a text layer is replaced, so
`#designation, #organisation` in one text layer works. Empty values become blank.

- Text **outside** `@speaker` is filled with session fields.
- Text **inside** `@speaker` is filled with that speaker's fields.

| Session fields | Speaker fields |
| --- | --- |
| `#name` | `#name` |
| `#category` | `#designation` |
| `#start_time`, `#end_time` | `#organisation` |
| `#venue` | `#linkedin` |
| `#description` | `#category` |
| `#link`, `#link_text` | `#photo` (image layer, see above) |
| `#id`, `#campaign_id` | `#id`, `#order` |

The fields come straight from the API response, so any new field the API adds can be used as `#<field>`.

### Tips

- Fonts used in the template must be available in Figma; they are loaded before text is replaced.
- Give `#photo` a placeholder image fill. A layer with only a solid fill is not treated as an image slot.
- If a speaker photo is missing or fails to load, the card keeps the placeholder image and a notice names the speaker.
- Image URLs must be on a domain listed in `manifest.json` → `networkAccess.allowedDomains`.
