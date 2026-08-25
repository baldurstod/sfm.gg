import { ContentPanel } from './content';
import { Panel } from './panel';
import { StatusBar } from './statusbar';
import { Toolbar } from './toolbar';

export class AppPanel extends Panel {
	#panels = new Map<string, Panel>();

	constructor() {
		super();
		this.addPanel('toobar', new Toolbar());
		this.addPanel('content', new ContentPanel());
		this.addPanel('statusbar', new StatusBar());
	}

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ layout: 'column' });
		//this.panel!.setDirection('column');
		document.body.append(this.panel!.htmlElement);
	}

	addPanel(name: string, panel: Panel): void {
		this.#panels.set(name, panel);
		this.initPanel();
		this.panel!.append(panel.getPanel());
	}
}
