# T03 maintainer correction — public bootstrap and scene scrolling

Original Worker run: [#39002090324](https://github.com/sanchuang-dev/ai-mirror/actions/runs/39002090324).
Independent maintainer recheck after PR #34 original Worker commit. Original screenshots are historical snapshots, not evidence of the corrected public bootstrap.

## Scope

- Personal-device community preview allows returning to the personal demo, clearly labelled as a preview.
- Public-device bootstrap (S1 preview URL ?device=public) starts in G00, with no private scene/nav/settings/name/AI FAB/return-to-private button. The central route gate rejects attempts to show private routes on public deployment. Public mode never reads injected personal preferences.
- Scene scrolling is independently saved and restored by route; each first entry begins at top.

The public bootstrap query is a static demo selector, not authentication. Production needs trusted device configuration and server authorization; no actual private-data security is claimed here. X01 clearing is separate.

## Independent verification

- Fresh npm ci and npm run check: **35/35 passing** (the previous 33 tests retained, two new regression tests).
- Chrome/Puppeteer real browser clicks at **1600x900** and **540x960**:
  - Home scroll 1300 -> first video entry 0 -> video scroll 120 -> first course entry 0 -> home returns to 1300 -> video restores 120.
  - Personal-device preview enters public body without private identity and exits preview to personal body.
  - With stored theme B, ?device=public boots public body in default A, ignores but does not delete personal theme B, and displays no private name/settings/home/return control. Signup feedback remains on public view.
  - No whole-page horizontal overflow or uncaught JavaScript page exceptions.
- Real Android WebView, touchscreen, kiosk host and live authorization were not tested.
