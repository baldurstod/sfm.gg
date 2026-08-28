import { HarmonyPanel, HarmonyPanelParams } from 'harmony-ui';

export class Panel {
	//protected shadowRoot?: ShadowRoot;
	protected panel?: HarmonyPanel;

	protected initPanel(params?: HarmonyPanelParams): void {
		if (this.panel) {
			return;
		}
		this.panel = new HarmonyPanel(params);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	protected refreshHTML(): void { }

	getPanel(): HarmonyPanel {
		this.initPanel();
		return this.panel!;
	}

	open(): void {
		this.getPanel();
	}

	hide(): void {
		//hide(this.shadowRoot?.host as HTMLElement);
	}

	show(): void {
		//show(this.shadowRoot?.host as HTMLElement);
	}

	isVisible(): boolean {
		//return isVisible(this.shadowRoot?.host as HTMLElement);
		throw new Error('code me');
	}
}
