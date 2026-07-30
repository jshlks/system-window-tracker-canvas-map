import { Plugin, PluginSettingTab, App, Setting, Notice, TFile, Editor, MarkdownView, requestUrl } from 'obsidian';

// ============================================================================
// TYPE DEFINITIONS & INTERFACES
// ============================================================================

interface SystemWindowTrackerSettings {
	gumroadLicenseKey: string;
	isPremium: boolean;
	trackingInterval: number;
	lastVerificationTime: number | null;
	verificationCacheValid: boolean;
}

interface TelemetryPayload {
	appName: string;
	windowTitle: string;
	url: string;
	timestamp: number;
}

interface GumroadValidationResponse {
	success: boolean;
	message?: string;
	purchase?: {
		product_id: string;
		product_name: string;
		custom_permalink?: string;
		custom_fields?: Record<string, string>;
		chargebacked: boolean;
		refunded: boolean;
		disputed: boolean;
		dispute_won: boolean;
		created_at: string;
	};
}

const DEFAULT_SETTINGS: SystemWindowTrackerSettings = {
	gumroadLicenseKey: '',
	isPremium: false,
	trackingInterval: 5000,
	lastVerificationTime: null,
	verificationCacheValid: false,
};

const GUMROAD_PRODUCT_ID = '3cJVL4qhrzGviVHzKP2aoQ==';
const GUMROAD_API_URL = 'https://api.gumroad.com/v2/licenses/verify';
const GUMROAD_CHECKOUT_URL = 'https://joshua633.gumroad.com/l/emufle?wanted=true';
const PREMIUM_PRICE = '$8.00/mo';

// ============================================================================
// MAIN PLUGIN CLASS
// ============================================================================

export default class SystemWindowTrackerCanvasMapPlugin extends Plugin {
	settings!: SystemWindowTrackerSettings;
	private trackingIntervalId: number | null = null;
	private lastTelemetryPayload: TelemetryPayload | null = null;

	async onload(): Promise<void> {
		console.log('Loading System Window Tracker & Canvas Map');

		await this.loadSettings();

		this.addSettingTab(new SystemWindowTrackerSettingTab(this.app, this));

		this.addCommand({
			id: 'verify-license-key',
			name: 'Verify License Key',
			callback: async () => {
				if (!this.settings.gumroadLicenseKey) {
					new Notice('Please enter a license key in settings first.');
					return;
				}
				await this.validateLicenseWithGumroad(true);
			},
		});

		this.addCommand({
			id: 'toggle-tracking',
			name: 'Toggle Window Tracking',
			callback: () => {
				if (this.trackingIntervalId) {
					this.stopTracking();
				} else {
					this.startTracking();
				}
			},
		});

		if (this.settings.gumroadLicenseKey && this.settings.verificationCacheValid) {
			await this.validateLicenseWithGumroad(false);
		}

		if (this.settings.isPremium) {
			console.log('Premium tier active - Canvas automation enabled');
		} else {
			console.log('Free tier active - Basic text logging enabled');
		}
	}

	onunload(): void {
		console.log('Unloading System Window Tracker & Canvas Map');
		this.stopTracking();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	// ========================================================================
	// LICENSE VALIDATION - DIRECT GUMROAD API
	// ========================================================================

	async validateLicenseWithGumroad(showNotices: boolean = false): Promise<boolean> {
		const licenseKey = this.settings.gumroadLicenseKey.trim();

		if (!licenseKey) {
			this.settings.isPremium = false;
			this.settings.verificationCacheValid = false;
			await this.saveSettings();
			if (showNotices) {
				new Notice('No license key provided.');
			}
			return false;
		}

		try {
			const response = await requestUrl({
				url: GUMROAD_API_URL,
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					product_id: GUMROAD_PRODUCT_ID,
					license_key: licenseKey,
					increment_uses_count: 'false',
				}).toString(),
			});

			const data: GumroadValidationResponse = response.json;

			if (data.success) {
				this.settings.isPremium = true;
				this.settings.verificationCacheValid = true;
				this.settings.lastVerificationTime = Date.now();
				await this.saveSettings();

				if (showNotices) {
					new Notice(`✅ Premium License Verified! Welcome to ${PREMIUM_PRICE} tier.`);
				}
				console.log('License verified successfully:', data.purchase?.product_name);
				return true;
			} else {
				this.settings.isPremium = false;
				this.settings.verificationCacheValid = true;
				this.settings.lastVerificationTime = Date.now();
				await this.saveSettings();

				if (showNotices) {
					new Notice(`❌ License Invalid: ${data.message || 'Unknown error'}`);
				}
				console.warn('License validation failed:', data.message);
				return false;
			}
		} catch (error) {
			console.error('Network error during license validation:', error);

			if (this.settings.verificationCacheValid && this.settings.lastVerificationTime) {
				const hoursSinceVerification = (Date.now() - this.settings.lastVerificationTime) / (1000 * 60 * 60);
				if (hoursSinceVerification < 72) {
					if (showNotices) {
						new Notice('⚠️ Offline mode: Using cached premium status');
					}
					return this.settings.isPremium;
				}
			}

			if (showNotices) {
				new Notice('⚠️ Network error: Cannot verify license. Check your connection.');
			}
			return false;
		}
	}

	// ========================================================================
	// TELEMETRY TRACKING LOOP
	// ========================================================================

	private startTracking(): void {
		if (this.trackingIntervalId) {
			return;
		}

		new Notice('Window tracking started');
		console.log('Starting telemetry loop...');

		this.trackingIntervalId = window.setInterval(() => {
			this.captureTelemetry();
		}, this.settings.trackingInterval);
	}

	private stopTracking(): void {
		if (this.trackingIntervalId) {
			window.clearInterval(this.trackingIntervalId);
			this.trackingIntervalId = null;
			new Notice('Window tracking stopped');
			console.log('Telemetry loop stopped');
		}
	}

	private captureTelemetry(): void {
		const payload = this.simulateOSWindowCapture();
		this.lastTelemetryPayload = payload;

		if (this.settings.isPremium) {
			this.handlePremiumTelemetry(payload);
		} else {
			this.handleFreeTierTelemetry(payload);
		}
	}

	private simulateOSWindowCapture(): TelemetryPayload {
		const activeWindow = document.activeElement;
		const appContainer = document.querySelector('.mod-root') as HTMLElement;
		
		let appName = 'Obsidian';
		let windowTitle = 'Unknown';
		let url = '';

		const titleEl = document.querySelector('.workspace-tab-header.is-active');
		if (titleEl) {
			windowTitle = titleEl.getAttribute('aria-label') || 'Active Tab';
		}

		const simulatedApps = [
			{ name: 'Chrome', title: 'OpenAI Research Docs', url: 'https://platform.openai.com/docs' },
			{ name: 'VS Code', title: 'main.ts - Project', url: '' },
			{ name: 'Slack', title: '#general - Team', url: '' },
			{ name: 'Firefox', title: 'GitHub Repository', url: 'https://github.com' },
			{ name: 'Terminal', title: 'bash - zsh', url: '' },
		];

		const randomApp = simulatedApps[Math.floor(Math.random() * simulatedApps.length)];
		appName = randomApp.name;
		windowTitle = randomApp.title;
		url = randomApp.url;

		return {
			appName,
			windowTitle,
			url,
			timestamp: Date.now(),
		};
	}

	// ========================================================================
	// FREEMIUM GATE DISPATCHER
	// ========================================================================

	private handleFreeTierTelemetry(payload: TelemetryPayload): void {
		const editor = this.getActiveEditor();
		if (!editor) {
			return;
		}

		const timeString = new Date(payload.timestamp).toLocaleTimeString([], { 
			hour: '2-digit', 
			minute: '2-digit' 
		});

		let logEntry = `- [OS Log] ${timeString} - ${payload.appName}: ${payload.windowTitle}`;
		if (payload.url) {
			logEntry += ` (${payload.url})`;
		}

		const currentContent = editor.getValue();
		const newContent = currentContent.trim() ? `${currentContent}\n${logEntry}` : logEntry;
		editor.setValue(newContent);

		console.log('Free tier log:', logEntry);
	}

	private handlePremiumTelemetry(payload: TelemetryPayload): void {
		this.executeCanvasAutomationEngine(payload);
		console.log('Premium tier: Canvas automation executed');
	}

	// ========================================================================
	// CANVAS AUTOMATION ENGINE (PREMIUM ONLY)
	// ========================================================================

	private async executeCanvasAutomationEngine(payload: TelemetryPayload): Promise<void> {
		const vault = this.app.vault;
		
		// Find or create the System Tracker canvas file
		const allFiles = vault.getFiles();
		let targetCanvas = allFiles.find(f => f.name === 'System Tracker.canvas');
		
		if (!targetCanvas) {
			// Create new canvas file with initial structure
			const initialCanvasData = {
				nodes: [],
				edges: [],
				viewState: { x: 0, y: 0, zoom: 1 }
			};
			targetCanvas = await vault.create('System Tracker.canvas', JSON.stringify(initialCanvasData, null, 2));
		}

		// Read and parse existing canvas data
		let canvasObj: { nodes: any[]; edges: any[]; viewState: any };
		
		try {
			const canvasData = await vault.read(targetCanvas);
			canvasObj = JSON.parse(canvasData);
			
			// Validate structure
			if (!Array.isArray(canvasObj.nodes)) {
				canvasObj.nodes = [];
			}
			if (!Array.isArray(canvasObj.edges)) {
				canvasObj.edges = [];
			}
		} catch (parseError) {
			console.error('Failed to parse canvas file, resetting:', parseError);
			canvasObj = { nodes: [], edges: [], viewState: { x: 0, y: 0, zoom: 1 } };
		}

		// Generate unique node ID
		const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const existingNodes = canvasObj.nodes;
		const lastNode = existingNodes.length > 0 ? existingNodes[existingNodes.length - 1] : null;
		
		// Calculate position for new node (cascade down)
		const yPos = lastNode ? lastNode.y + 150 : 0;
		const xPos = lastNode ? lastNode.x : 100;

		// Build node label with telemetry data
		const timeString = new Date(payload.timestamp).toLocaleTimeString([], { 
			hour: '2-digit', 
			minute: '2-digit',
			second: '2-digit'
		});
		
		let nodeLabel = `[${timeString}] ${payload.appName}`;
		if (payload.windowTitle && payload.windowTitle !== 'Unknown') {
			nodeLabel += `\n${payload.windowTitle}`;
		}
		if (payload.url) {
			nodeLabel += `\n${payload.url}`;
		}

		// Create new canvas node with Obsidian Canvas format
		const newNode = {
			id: nodeId,
			x: xPos,
			y: yPos,
			width: 300,
			height: 120,
			type: 'text' as const,
			text: nodeLabel,
			color: this.getAppColor(payload.appName)
		};

		// Add node to canvas
		canvasObj.nodes.push(newNode);

		// Create edge connection from previous node if exists
		if (lastNode && lastNode.id) {
			const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			canvasObj.edges.push({
				id: edgeId,
				fromNode: lastNode.id,
				toNode: nodeId,
				fromEnd: 'bottom' as const,
				toEnd: 'top' as const,
				fromSide: 'bottom' as const,
				toSide: 'top' as const
			});
		}

		// Limit canvas to last 50 nodes to prevent performance issues
		if (canvasObj.nodes.length > 50) {
			const nodesToRemove = canvasObj.nodes.length - 50;
			const removedNodeIds = canvasObj.nodes.slice(0, nodesToRemove).map((n: any) => n.id);
			canvasObj.nodes = canvasObj.nodes.slice(nodesToRemove);
			
			// Remove edges connected to deleted nodes
			canvasObj.edges = canvasObj.edges.filter((e: any) => 
				!removedNodeIds.includes(e.fromNode) && !removedNodeIds.includes(e.toNode)
			);
		}

		// Write updated canvas back to vault
		try {
			await vault.modify(targetCanvas, JSON.stringify(canvasObj, null, 2));
			console.log('Canvas automation: Node added successfully');
		} catch (writeError) {
			console.error('Failed to write canvas file:', writeError);
			new Notice('⚠️ Failed to update Canvas tracker file');
		}
	}

	private getAppColor(appName: string): string {
		const colorMap: Record<string, string> = {
			'Chrome': '#4285f4',
			'Firefox': '#ff7139',
			'VS Code': '#007acc',
			'Slack': '#4a154b',
			'Terminal': '#333333',
		};
		return colorMap[appName] || '#808080';
	}

	private getActiveEditor(): Editor | null {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			return null;
		}
		return activeView.editor;
	}
}

// ============================================================================
// SETTINGS TAB UI
// ============================================================================

class SystemWindowTrackerSettingTab extends PluginSettingTab {
	plugin: SystemWindowTrackerCanvasMapPlugin;

	constructor(app: App, plugin: SystemWindowTrackerCanvasMapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'System Window Tracker Settings' });

		this.createPremiumStatusBanner(containerEl);

		containerEl.createEl('h3', { text: 'License Configuration' });

		new Setting(containerEl)
			.setName('Gumroad License Key')
			.setDesc('Enter your premium license key to unlock Canvas automation features.')
			.addText(text => text
				.setPlaceholder('Enter your license key...')
				.setValue(this.plugin.settings.gumroadLicenseKey)
				.onChange(async (value) => {
					this.plugin.settings.gumroadLicenseKey = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Verify License')
			.setDesc('Manually verify your license key with Gumroad servers.')
			.addButton(button => button
				.setButtonText('Verify Now')
				.setCta()
				.onClick(async () => {
					await this.plugin.validateLicenseWithGumroad(true);
					this.display();
				}));

		new Setting(containerEl)
			.setName('Upgrade to Premium')
			.setDesc(`Unlock Canvas automation and advanced features for ${PREMIUM_PRICE}`)
			.addButton(button => button
				.setButtonText('Purchase License →')
				.onClick(() => {
					window.open(GUMROAD_CHECKOUT_URL, '_blank');
				}));

		containerEl.createEl('h3', { text: 'Tracking Configuration' });

		new Setting(containerEl)
			.setName('Tracking Interval (ms)')
			.setDesc('How often to capture window telemetry (minimum 1000ms)')
			.addSlider(slider => slider
				.setLimits(1000, 30000, 500)
				.setValue(this.plugin.settings.trackingInterval)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.trackingInterval = value;
					await this.plugin.saveSettings();
				}));
	}

	private createPremiumStatusBanner(containerEl: HTMLElement): void {
		const bannerDiv = containerEl.createDiv('premium-status-banner');
		bannerDiv.style.cssText = `
			padding: 20px;
			border-radius: 8px;
			margin-bottom: 20px;
			text-align: center;
			font-weight: bold;
			border: 2px solid ${this.plugin.settings.isPremium ? '#4CAF50' : '#FF9800'};
			background: ${this.plugin.settings.isPremium ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)'};
			color: ${this.plugin.settings.isPremium ? '#4CAF50' : '#FF9800'};
		`;

		if (this.plugin.settings.isPremium) {
			bannerDiv.innerHTML = `
				<div style="font-size: 24px;">✅</div>
				<div style="font-size: 18px; margin-top: 8px;">Premium Tier Active</div>
				<div style="font-size: 14px; opacity: 0.8; margin-top: 4px;">Canvas Automation Engine Enabled</div>
			`;
		} else {
			bannerDiv.innerHTML = `
				<div style="font-size: 24px;">🔒</div>
				<div style="font-size: 18px; margin-top: 8px;">Free Tier Active</div>
				<div style="font-size: 14px; opacity: 0.8; margin-top: 4px;">Upgrade to ${PREMIUM_PRICE} for Canvas automation</div>
			`;
		}
	}
}
