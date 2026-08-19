import { MainPanel } from './main';
import { Outline } from './outline';
import { Panel } from './panel';

export class ContentPanel extends Panel {
	#outline = new Outline();
	//#viewports = new Viewports();
	#main = new MainPanel();

	protected initPanel(): void {
		super.initPanel({ size: 1, layout: 'row', });
		this.panel!.append(this.#outline.getPanel(), this.#main.getPanel());
	}
}
