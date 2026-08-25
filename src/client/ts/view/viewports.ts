import viewportsCSS from '../../css/viewports.css';
import { Panel } from './panel';
import { ViewportPanel } from './viewport';

export class Viewports extends Panel {
	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: viewportsCSS, dropTarget: true, titleI18n: '#viewports', });

		const vp1 = new ViewportPanel('#primary_viewport');
		this.panel!.append(vp1.getPanel());

		const vp2 = new ViewportPanel('#secondary_viewport');
		this.panel!.append(vp2.getPanel());
	}
}
