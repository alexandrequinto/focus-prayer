# Focus Prayer

A Chrome extension that blocks distracting websites for as long as you commit to your intention.

No accounts. No sync. No server. Everything runs locally.

---

## How it works

1. **State your intention** — write what you're showing up to do, or leave it blank for silence
2. **Choose a focus type** — Deep Work, Study, Creative, or Full Detox
3. **Set a duration** — 25, 50, 90 minutes, or custom
4. **Pray** — take a breath, commit, and begin

Your chosen sites are blocked for the duration. If you try to visit one, you'll be reminded of your intention and given the option to break focus — but it counts as a sin. Your sins are recorded.

---

## Install from the Chrome Web Store

> Coming soon.

---

## Install manually (developer mode)

1. Download the latest release zip from the [Releases](https://github.com/alexandrequinto/focus-prayer/releases) page, or clone the repo:
   ```bash
   git clone https://github.com/alexandrequinto/focus-prayer.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the `focus-prayer` folder

The extension will appear in your toolbar.

---

## Block list presets

| Preset | Blocks |
|---|---|
| **Deep Work** | Social, news, video, chat |
| **Study** | Social, video, entertainment |
| **Creative** | Social and feeds only |
| **Full Detox** | Everything |

You can add or remove domains from any preset via the settings page (right-click the extension icon → Options).

---

## Privacy

Focus Prayer collects no data. Everything — your intentions, sessions, sin history — stays in your browser via `chrome.storage.local`.

Full policy: [PRIVACY.md](./PRIVACY.md)

---

## License

[GPL-3.0](./LICENSE) — Alexandre Quinto, 2026

## Contributing

Issues and PRs welcome.
