import advancedOptionsCSS from '../../css/advancedoptions.css';
import { Panel } from './panel';

export class AdvancedOptionsPanel extends Panel {
	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: advancedOptionsCSS, titleI18n: '#advanced_options', });
		this.panel!.append('options');
	}
}
