import { createElement } from 'harmony-ui';
import timelineCSS from '../../css/timeline.css';
import { Controller } from '../controller';
import { SfmFilm } from '../model/film';
import { SfmFilmClip } from '../model/filmclip';
import { SfmTrack } from '../model/track';
import { Panel } from './panel';

export class TimelinePanel extends Panel {
	#activeFilmClip: SfmFilmClip | null = null;
	#activeFilm: SfmFilm | null = null;
	#playHeadPos = 0;
	#htmlTracks = new WeakMap<SfmTrack, HTMLElement>();
	#htmlContent?: HTMLElement;
	#htmlTimeTracks: HTMLElement[] = [];
	#timeScale = 1;
	// Time offset, in second
	#timeOffset = 2;
	// Pixels per second;
	#timeUnit = 10;

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, layout: 'column', adoptStyle: timelineCSS, titleI18n: '#timeline', });
		//this.panel!.append('TimelinePanel');

		this.panel!.getContent().addEventListener('wheel', (event: WheelEvent) => this.#mouseWheel(event));

		this.#htmlTimeTracks[0] = createElement('div', {
			parent: this.panel!.getContent(),
			class: 'time-track top',
			innerHTML: '<ul class="ruler"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>',
			$click: (event: PointerEvent) => this.#timeClick(event),
		});

		this.#htmlContent = createElement('div', {
			parent: this.panel!.getContent(),
			class: 'content',
			innerText: 'content',
		});

		this.#htmlTimeTracks[1] = createElement('div', {
			parent: this.panel!.getContent(),
			class: 'time-track bottom',
			innerHTML: '<ul class="ruler"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>',
		});
		this.#setCssVars();
	}

	constructor() {
		super();
		Controller.addEventListener('setactivefilmclip', (event) => this.#setActiveFilmClip(event.detail));
		Controller.addEventListener('setactivefilm', (event) => this.#setActiveFilm(event.detail));
	}

	#setActiveFilmClip(clip: SfmFilmClip): void {
		this.#activeFilmClip = clip;
		this.refreshHTML();
	}

	#setActiveFilm(film: SfmFilm): void {
		this.#activeFilm = film;
		this.refreshHTML();
	}

	protected refreshHTML(): void {

	}

	#mouseWheel(event: WheelEvent): void {
		let deltaY = 0;
		switch (event.deltaMode) {
			case 0://DOM_DELTA_PIXEL
				deltaY = event.deltaY;
				break;
			case 1://DOM_DELTA_LINE
				deltaY = event.deltaY * 10;
				break;
			case 2://DOM_DELTA_PAGE
				deltaY = event.deltaY * 100;
				break;
		}

		event.preventDefault();
		event.stopPropagation();

		const mul = Math.sign(deltaY!) < 0 ? 1.1 : 1 / 1.1;

		this.#setTimeScale(this.#timeScale * mul);
	}

	#timeClick(event: PointerEvent): void {
		const time = (event.offsetX / (this.#timeUnit * this.#timeScale)) - this.#timeOffset;
		console.info(event.offsetX, time);
		this.#setPlayPos(time);
	}

	#setTimeScale(timeScale: number): void {
		// Recompute time offset to prevent the playhead from moving during scaling
		const newOffset = (this.#playHeadPos + this.#timeOffset) * this.#timeScale / timeScale - this.#playHeadPos;
		this.#setTimeOffset(newOffset);

		this.#timeScale = timeScale;
		this.#setCssVars();
	}

	#setTimeOffset(timetimeOffset: number): void {
		this.#timeOffset = timetimeOffset;
		this.#setCssVars();
	}

	#setPlayPos(playPos: number): void {
		this.#playHeadPos = playPos;
		this.#setCssVars();
	}

	#setCssVars(): void {
		if (this.panel) {
			this.panel.getContent().style.setProperty('--time-scale', String(this.#timeScale));
			this.panel.getContent().style.setProperty('--time-offset', String(this.#timeOffset));
			this.panel.getContent().style.setProperty('--play-head', String(this.#playHeadPos));
			this.panel.getContent().style.setProperty('--ruler-unit', `${this.#timeUnit}px`);
		}
	}
}
