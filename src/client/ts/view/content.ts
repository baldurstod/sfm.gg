import { MainPanel } from './main';
import { OutlinePanel } from './outline';
import { Panel } from './panel';

export class ContentPanel extends Panel {
	#outline = new OutlinePanel();
	//#viewports = new Viewports();
	#main = new MainPanel();

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, layout: 'row', });
		this.panel!.append(this.#outline.getPanel(), this.#main.getPanel());
	}
}
