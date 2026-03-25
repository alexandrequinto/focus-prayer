# Privacy Policy — Focus Prayer

**Last updated: March 25, 2026**

Focus Prayer is a Chrome extension that helps you block distracting websites during a focus session.

## Data collection

Focus Prayer collects no personal data. It does not track you, profile you, or transmit any information to any server — because there is no server.

## What is stored locally

The following data is stored in your browser using `chrome.storage.local`, which never leaves your device:

- Your session intention (text you type)
- Your chosen block list and duration
- Your session history and sin log

This data exists solely to power the extension's UI. It is never synced, never shared, and never sent anywhere.

## Permissions

- **declarativeNetRequest** — used to block websites you have chosen to block during a session. No browsing history is read or stored.
- **storage** — used to save session state locally on your device.
- **alarms** — used to end your session after the chosen duration.
- **host_permissions (<all_urls>)** — required by the blocking API to apply rules to user-selected domains. Page content is never accessed.

## Third parties

None. Focus Prayer has no analytics, no crash reporting, no ads, and no external dependencies.

## Contact

If you have questions, open an issue at https://github.com/alexandrequinto/focus-prayer
