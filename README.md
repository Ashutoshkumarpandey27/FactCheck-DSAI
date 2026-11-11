# SachCheck

SachCheck is a local fact-checking workspace. You submit a message, claim, article URL, or screenshot; SachCheck separates factual assertions from opinions or ambiguous wording, searches for relevant sources, reads the source pages, and produces a report with evidence passages you can inspect.

The application runs on your own computer at `http://127.0.0.1:4173`. Nothing is deployed automatically.

## Fast start on Windows

### 1. Install Node.js

Install **Node.js 22 LTS or newer** from [nodejs.org](https://nodejs.org/).

After installation, open PowerShell and check:

```powershell
node --version
```

The version should be `v22.13.0` or newer. If Windows says that `node` is not recognized, close and reopen PowerShell after installing Node.js.

### 2. Extract the ZIP

Right-click `SachCheck-local.zip`, choose **Extract All**, and open the extracted `SachCheck` folder. Do not run the project from inside the ZIP preview.

### 3. Start SachCheck

Double-click:

```text
Start SachCheck.bat
```

Keep the black terminal window open while using SachCheck. Your browser should open automatically at:

[http://127.0.0.1:4173](http://127.0.0.1:4173)

If the browser does not open, copy that address into Chrome, Edge, or Firefox. To stop SachCheck, return to the terminal and press `Ctrl+C`, then close the window.

## Manual start commands

If the batch file does not work, open the extracted `SachCheck` folder in PowerShell. An easy way is to click the folder address bar, type `powershell`, and press Enter. Then run:

```powershell
node scripts/build-worker.mjs
node scripts/preview-worker.mjs
```

Leave the second command running and open `http://127.0.0.1:4173`.

No `npm install` is needed for this lightweight local package.

## OpenAI API key

Live checks require an OpenAI API key. ChatGPT subscriptions and API billing are separate.

1. Create or manage a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Open SachCheck locally.
3. Find the **Local preview** API-key field.
4. Paste the key there and wait for the **Ready for this tab** message.
5. Submit a claim in **Live** mode.

For this local package, the key is kept only in the current browser tab, sent to the local SachCheck server for API requests, and not written into project files or browser storage. Reloading or closing the tab clears it.

Never place an API key in a screenshot, message, README, or shared ZIP. If a key was shared publicly, revoke it and create a replacement.

## How to use SachCheck

### Text

Paste the complete message, including names, dates, amounts, negation, and surrounding context. Do not reduce it to isolated keywords.

Examples of useful factual inputs:

- `The application deadline is 30 November 2026.`
- `RBI increased the repo rate to 6.75% in October 2026.`
- `सरकार ने इस योजना की आखिरी तारीख 15 दिसंबर तक बढ़ा दी है।`
- `Mumbai mein kal schools band rahenge because of heavy rain.`

If the message is an opinion, prediction, question, satire, or materially ambiguous, SachCheck should explain that instead of manufacturing a factual verdict.

### Article URL

Choose the URL input, paste a public `http` or `https` article address, and run the check. Some paywalled, login-only, blocked, very large, or PDF pages may not be readable. In that case, paste the relevant text directly.

### Screenshot

Upload a PNG, JPG, or WEBP image up to 8 MB. SachCheck extracts visible text with the vision model. Review and correct the extracted text before starting the fact-check.

## Reading the result

- **Supported** — retrieved passages directly support the complete factual assertion.
- **Contradicted** — retrieved passages directly conflict with it.
- **Misleading context** — the wording omits or changes important scope, timing, geography, or qualifications.
- **Insufficient evidence** — the available readable evidence cannot justify a decisive conclusion.
- **No verdict** — opinions, predictions, questions, satire, and ambiguous statements stay outside the factual verdict system.

Open every cited source and read the shown passage. SachCheck is an investigation aid, not a guarantee of truth.

## Live mode and Demo mode

- **Live mode** uses the submitted custom text, OpenAI models, web search, and retrieved public source pages.
- **Demo mode** uses clearly labelled fictional JanSetu examples and a fictional bundled notice.

Custom submissions must use Live mode. SachCheck does not silently match custom text to a fictional demo report.

## Privacy and safety

- The server binds only to `127.0.0.1`, so other computers on the network cannot access it by default.
- Submitted content is sent to OpenAI during Live checks.
- Candidate public source pages are downloaded by the local server for evidence extraction.
- The application blocks local-network and metadata addresses, limits redirects and response sizes, and applies request timeouts.
- Retrieved web content is treated as untrusted evidence, not as instructions.
- Do not submit private, confidential, medical, financial, or identity information unless you are comfortable sending it to the configured API provider.

## Troubleshooting

### `node` is not recognized

Install Node.js from `nodejs.org`, then close and reopen PowerShell.

### Port 4173 is already in use

In PowerShell, choose another port:

```powershell
$env:PORT=4174
node scripts/preview-worker.mjs
```

Then open `http://127.0.0.1:4174`.

### Windows Firewall asks for permission

Allow Node.js on **Private networks** only. SachCheck listens on the local computer, not on the public internet.

### Missing credentials

Enter a valid API key in the Local preview field. API keys normally begin with `sk-`. Confirm that the API account has available credit and permission to use the configured models.

### `401`, invalid key, or authentication error

The key is invalid, revoked, copied incorrectly, or belongs to an account without access. Create a new key and try again.

### `429`, quota, or rate-limit error

The API account may have exhausted its credit or request limit. Check [platform.openai.com/usage](https://platform.openai.com/usage) and billing settings.

### A source cannot be read

The page may require login, block automated access, return a PDF, or time out. SachCheck will report the retrieval limitation; it should not treat failure as evidence that the claim is false.

### The terminal closes immediately

Use the manual PowerShell commands above so the error remains visible.

## Optional developer checks

From the project folder:

```powershell
node --check workspace-src/app.js
node --check worker-src/worker.mjs
node --test tests/live-pipeline.test.mjs
node scripts/build-worker.mjs
node --check dist/server/index.js
```

## Project structure

- `workspace-src/` — browser interface.
- `worker-src/worker.mjs` — local API, interpretation, investigation, retrieval, evidence assessment, report validation, and static asset serving.
- `tests/` — pipeline and reliability evaluations.
- `scripts/build-worker.mjs` — builds the runnable Worker bundle.
- `scripts/preview-worker.mjs` — starts the local server.
- `scripts/start-local.mjs` — one-command build and start helper used by the Windows launcher.

## Current limitations

- Search and model quality still depend on the configured OpenAI models and available API access.
- Paywalled, login-only, blocked, and some JavaScript-rendered pages may be inaccessible.
- PDF evidence is reported as a retrieval limitation in this local version.
- A lack of readable sources means **Insufficient evidence**, not that a claim is false.
- Important or high-stakes decisions should be checked against original documents and qualified professionals.

## Sharing this project

Send only `SachCheck-local.zip`. Do not include an API key. Each person should use their own API key and API account.