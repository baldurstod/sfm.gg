import timelineCSS from '../../css/timeline.css';
import { Controller } from '../controller';
import { SfmFilmClip } from '../model/filmclip';
import { Panel } from './panel';

export class TimelinePanel extends Panel {
	#activeFilmClip: SfmFilmClip | null = null;
	#playHeadPos = 0;

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: timelineCSS, titleI18n: '#timeline', });
		this.panel!.append('TimelinePanel');
	}

	constructor(titleI18n?: string) {
		super();
		Controller.addEventListener('setactivefilmclip', (event) => this.#setActiveFilmClip(event.detail));
	}

	#setActiveFilmClip(clip: SfmFilmClip): void {
		this.#activeFilmClip = clip;
		this.refreshHTML();
	}

	protected refreshHTML(): void {

	}
}
