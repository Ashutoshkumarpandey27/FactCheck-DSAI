# SachCheck — local package

SachCheck runs on your computer. Nothing in this package is deployed, and no API key is included.

## Requirements

- Node.js 22 or newer: <https://nodejs.org/>
- Internet access for OpenAI and evidence sources
- Your own OpenAI API key with API credit

No `npm install` is required.

## Start on macOS

Open Terminal in this folder and run:

```bash
npm start
```

Alternatively, right-click **Start SachCheck.command**, select **Open**, and confirm **Open** if macOS asks.

## Start on Windows

Open PowerShell or Command Prompt in this folder and run:

```powershell
npm start
```

Alternatively, double-click **Start SachCheck.bat**.

## Use SachCheck

1. The browser should open automatically at <http://127.0.0.1:4173/>.
2. Enter your own OpenAI API key in the **Local preview** panel.
3. Check pasted text, an article URL, or a PNG/JPG/WEBP screenshot.
4. For screenshots, review and correct the extracted text before checking it.
5. Keep the terminal window open while using the app.
6. Press `Ctrl+C` in the terminal to stop SachCheck.

The API key is held only in the current browser tab. It is not written to this folder or browser storage. Reloading the page clears it.

## Optional self-test

```bash
npm test
```

 deployment

- Public URL: <https://sachcheck.sachcheck.workers.dev>
- Worker name: sachcheck
- Cloudflare version: 159a6d16-66fb-475c-a157-cf6bcf3e9e6f
- Deployment date: 11 November 2026
- Verified: homepage, /api/config, fictional demo source, and the complete bundled Demo report
- Current credential state: Demo mode is available; Live mode remains disabled until a fresh OPENAI_API_KEY secret is added


## Troubleshooting

- **`node` or `npm` is not recognized:** install Node.js 22 or newer, then reopen the terminal.
- **Port 4173 is already in use:** close the other SachCheck terminal with `Ctrl+C`, then run `npm start` again.
- **Browser does not open:** manually visit <http://127.0.0.1:4173/>.
- **Live check fails:** confirm the API key has API credit and the computer is online.
- **Screenshot text is imperfect:** use a clearer crop, then edit the extracted text before checking it.
