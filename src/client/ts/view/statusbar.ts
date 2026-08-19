import { Panel } from './panel';
import statusbarCSS from '../../css/statusbar.css';

export class Statusbar extends Panel {
	protected initPanel(): void {
		super.initPanel({ size: 0, adoptStyle: statusbarCSS });
		this.panel!.append('statusbar');
	}
}
