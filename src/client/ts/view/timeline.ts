import { createElement } from 'harmony-ui';
import timelineCSS from '../../css/timeline.css';
import { Controller } from '../controller';
import { SfmClip } from '../model/clip';
import { SfmFilmClip } from '../model/filmclip';
import { SfmTrack } from '../model/track';
import { Panel } from './panel';

export class TimelinePanel extends Panel {
	// Current clip displayed in the timeline
	#currentClip: SfmClip | null = null;
	// Selected sub clip
	#activeClip: SfmClip | null = null;
	#playHeadPos = 0;
	#htmlTracks = new WeakMap<SfmTrack, HTMLElement>();
	#htmlContent?: HTMLElement;
	#htmlTimeTracks: HTMLElement[] = [];
	#htmlPlayHead?: HTMLElement;
	#timeScale = 1;
	// Time offset, in second
	#timeOffset = 2;
	// Pixels per second;
	#timeUnit = 10;
	#frameRate = 24;
	#dragTime = false;

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, layout: 'column', adoptStyle: timelineCSS, titleI18n: '#timeline', });
		//this.panel!.append('TimelinePanel');

		this.panel!.getContent().addEventListener('wheel', (event: WheelEvent) => this.#mouseWheel(event));

		for (let i = 0; i < 2; i++) {
			this.#htmlTimeTracks[i] = createElement('div', {
				parent: this.panel!.getContent(),
				class: `time-track ${i === 0 ? 'top' : 'bottom'}`,
				innerHTML: '<ul class="ruler"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>',
				$click: (event: PointerEvent) => this.#timeClick(event),
				$mousemove: (event: MouseEvent) => this.#timeMouseMove(event),
				$mousedown: (event: MouseEvent) => this.#dragTime = true,
			});
		}

		this.#htmlContent = createElement('div', {
			after: this.#htmlTimeTracks[0],
			class: 'content',
			innerText: 'content',
			$mousemove: (event: MouseEvent) => this.#timeMouseMove(event),
		});

		this.#htmlPlayHead = createElement('div', {
			parent: this.panel!.getContent(),
			class: 'head',
		});

		this.#setCssVars();
	}

	constructor() {
		super();
		Controller.addEventListener('setactivefilmclip', (event) => this.#setActiveFilmClip(event.detail));
		Controller.addEventListener('setcurrentclip', (event) => this.#setCurrentClip(event.detail));
		Controller.addEventListener('setcurrenttime', (event) => this.#setCurrentTime(event.detail));
	}

	#setActiveFilmClip(clip: SfmFilmClip): void {
		this.#activeClip = clip;
		this.refreshHTML();
	}

	#setCurrentClip(clip: SfmClip): void {
		this.#currentClip = clip;
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
		this.#setPlayPos(time);
	}

	#timeMouseMove(event: MouseEvent): void {
		if (!this.#dragTime) {
			return;
		}
		if ((event.buttons & 1) === 0) {// Primary button is not pressed
			this.#dragTime = false;
			return;
		}

		const time = (event.offsetX / (this.#timeUnit * this.#timeScale)) - this.#timeOffset;
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
		//this.#playHeadPos = Math.round(playPos * this.#frameRate) / this.#frameRate;
		Controller.dispatchEvent('usersetcurrenttime', { detail: playPos, });
		//this.#setCssVars();
	}

	#setCssVars(): void {
		if (this.panel) {
			this.panel.getContent().style.setProperty('--time-scale', String(this.#timeScale));
			this.panel.getContent().style.setProperty('--time-offset', String(this.#timeOffset));
			this.panel.getContent().style.setProperty('--play-head', String(this.#playHeadPos));
			this.panel.getContent().style.setProperty('--ruler-unit', `${this.#timeUnit}px`);
		}
	}

	setFrameRate(frameRate: number): void {
		this.#frameRate = Math.max(Math.round(frameRate), 1);
	}

	#setCurrentTime(time: number): void {
		this.#playHeadPos = time;//Math.round(time * this.#frameRate) / this.#frameRate;
		this.#setCssVars();
		/*
		if (!this.#htmTime) {
			return;
		}

		this.#htmTime.innerText = formatTime(time);
		*/
	}

}
