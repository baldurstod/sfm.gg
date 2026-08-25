import { Panel } from './panel';
import statusbarCSS from '../../css/statusbar.css';

export class StatusBar extends Panel {
	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 0, adoptStyle: statusbarCSS });
		this.panel!.append('statusbar');
	}
}
