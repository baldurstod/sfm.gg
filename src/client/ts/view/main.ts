import { Panel } from './panel';
import { TimelinePanel } from './timeline';
import { Viewports } from './viewports';

export class MainPanel extends Panel {
	#viewports = new Viewports();
	#timeline = new TimelinePanel();

	protected initPanel(): void {
		super.initPanel({ size: 3, layout: 'column', dropTarget: true, });
		this.panel!.append(this.#viewports.getPanel(), this.#timeline.getPanel());
	}
}
