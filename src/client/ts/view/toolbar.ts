import { Panel } from './panel';
import toolbarCSS from '../../css/toolbar.css';

export class Toolbar extends Panel {
	protected initPanel(): void {
		super.initPanel({ size: 0, adoptStyle: toolbarCSS });
		this.panel?.setCollapsible(false);
		this.panel!.append('toolbar');
	}
}
