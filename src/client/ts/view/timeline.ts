import { Panel } from './panel';
import timelineCSS from '../../css/timeline.css';

export class TimelinePanel extends Panel {
	protected initPanel(): void {
		super.initPanel({ size: 1, adoptStyle: timelineCSS, titleI18n: '#timeline', });
		this.panel!.append('TimelinePanel');
	}
}
