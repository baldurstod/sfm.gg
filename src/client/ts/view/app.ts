import { ContentPanel } from './content';
import { Panel } from './panel';
import { Statusbar } from './statusbar';
import { Toolbar } from './toolbar';

export class AppPanel extends Panel {
	#panels = new Map<string, Panel>();

	constructor() {
		super();
		this.addPanel('toobar', new Toolbar());
		this.addPanel('content', new ContentPanel());
		this.addPanel('statusbar', new Statusbar());
	}

	protected initPanel(): void {
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
