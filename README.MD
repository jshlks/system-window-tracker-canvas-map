# System Window Tracker & Canvas Map

Maximize your personal knowledge management by bridging the gap between your operating system and your local vault. **System Window Tracker & Canvas Map** runs entirely client-side to automatically bridge, log, and map your active desktop apps, browser URLs, and window focuses directly inside Obsidian.

Whether you are tracking research trails, logging billable freelance hours, or building a visual matrix of your daily workflow, this plugin eliminates manual documentation entirely.

---

## 🚀 Key Features

* **Automated OS Timeline (Free Tier)**: Automatically logs your active system windows and browser tabs as clean, markdown timeline strings inside your daily scratchpad or active note views.
* **Visual Canvas Mesh Engine (Premium Tier)**: Instantly transforms your background desktop activity telemetry into an interactive, node-based mind map directly on an Obsidian Canvas. See your apps, files, and browser paths auto-arrange themselves spatially in real-time.
* **100% Privacy-First & Client-Side**: Your system activity never hits a cloud database or analytics server. All logging, telemetry parsing, and canvas rendering execute completely locally on your hardware.
* **Direct Billing Architecture**: Off-the-grid friendly. The plugin handles short-term offline use gracefully, securely checking subscription validity directly with Gumroad only when connected.

---

## 🛠️ Installation

### Method 1: Via BRAT (Recommended for Premium Features)
To bypass the marketplace review queue and unlock full Premium Canvas integration instantly:
1. Install the **BRAT** (Beta Reviewer's Auto-update Tool) plugin from the standard Obsidian community marketplace.
2. Navigate to Options -> BRAT -> **Add Beta Plugin**.
3. Paste the URL of this GitHub repository: `https://github.com`
4. Click **Add Plugin** and enable it in your Community Plugins settings panel.

### Method 2: Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the [Latest Release](https://github.com/releases) page.
2. Move the files into your vault under `.obsidian/plugins/system-window-tracker-canvas-map/`.
3. Reload Obsidian and toggle the plugin on in your settings panel.

---

## 💎 Freemium & Premium Setup ($8/mo)

This plugin operates on a freemium model. Basic text logging to your active editor is completely free forever.

To unlock the **Visual Canvas Mesh Engine**, secure an active monthly license key through our official billing portal:
👉 **[Secure your Premium License Key on Gumroad](https://gumroad.com)**

### Activating Your Key:
1. Open Obsidian Settings and select **System Window Tracker & Canvas Map**.
2. Paste your unique license code into the **Gumroad License Key** field.
3. Click **Verify Subscription Status** to instantly activate the spatial mapping engine dashboard.

---

## 🔒 Security & Offline Protection

* **No Proxy Servers**: This plugin communicates directly with `://gumroad.com` using native Obsidian network utilities. No middleman servers can intercept your license key or system metadata.
* **Offline Fallback Protocol**: If you travel or work without an active internet connection, the plugin securely preserves its premium features based on your last authenticated state. Verification will silently resume upon your next stable reconnect.

---

## 🧑‍💻 Developer Build Instructions

If you wish to inspect the source code or build the production distribution bundle manually:

```bash
# Clone the repository
git clone https://github.com.git
cd system-window-tracker-canvas-map

# Install development compiler environments
npm install

# Compile a minified, tree-shaken production build
node esbuild.config.mjs production
```

The compiled bundle will generate a highly optimized, minified `main.js` file ready for local vault deployment.

---

## 📄 License

This software is distributed under the MIT License. See [LICENSE](LICENSE) for more details.

For subscription support, cancellation, or payment modifications, please manage your account directly via your Gumroad library portal.
