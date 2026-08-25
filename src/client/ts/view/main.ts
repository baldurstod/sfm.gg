import { EditorPanel } from './editor';
import { Panel } from './panel';
import { TimelinePanel } from './timeline';

export class MainPanel extends Panel {
	#editor = new EditorPanel();
	#timeline = new TimelinePanel();

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 3, layout: 'column', dropTarget: true, });
		this.panel!.append(this.#editor.getPanel(), this.#timeline.getPanel());
	}
}
