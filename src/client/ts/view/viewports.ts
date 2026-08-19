import viewportsCSS from '../../css/viewports.css';
import { Panel } from './panel';
import { ViewportPanel } from './viewport';

export class Viewports extends Panel {
	protected initPanel(): void {
		super.initPanel({ size: 1, adoptStyle: viewportsCSS, });

		const vp1 = new ViewportPanel();
		//const vp2 = new Viewport();

		this.panel!.append(vp1.getPanel());
		//this.panel!.append(vp2.getPanel());
	}
}
