import { arrowMenuCloseSVG, arrowMenuOpenSVG } from 'harmony-svg';
import { createElement } from 'harmony-ui';
import timelineCSS from '../../css/timeline.css';
import { Controller } from '../controller';
import { SfmClip } from '../model/clips/clip';
import { SfmFilmClip } from '../model/clips/filmclip';
import { SfmTrack } from '../model/track';
import { SfmTrackGroup } from '../model/trackgroup';
import { Serializable } from '../serialize/serializable';
import { Panel } from './panel';

type DragOperation = 'time' | 'clipstart' | 'clipend';

export class TimelinePanel extends Panel {
	// Current clip displayed in the timeline
	#currentClip: SfmClip | null = null;
	// Selected sub clip
	#activeFilmClip: SfmFilmClip | null = null;
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
	//#dragTime = false;
	#elements = new Map<Serializable, HTMLElement>();
	#dragOperation: DragOperation | null = null;
	#dragElement: Serializable | null = null;

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
				$mousemove: (event: MouseEvent) => this.#handleMouseMove(event),
				$mousedown: (event: MouseEvent) => this.#dragOperation = 'time',
			});
		}

		this.#htmlContent = createElement('div', {
			after: this.#htmlTimeTracks[0],
			class: 'content',
			$mousemove: (event: MouseEvent) => this.#handleMouseMove(event),
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
		this.#activeFilmClip = clip;
		this.refreshHTML();
	}

	#setCurrentClip(clip: SfmClip): void {
		this.#currentClip = clip;
		this.refreshHTML();
	}

	protected refreshHTML(): void {
		this.#htmlContent?.replaceChildren();
		const activeFilmClip = this.#activeFilmClip;
		if (!activeFilmClip) {
			return;
		}

		for (const trackGroup of activeFilmClip.getTrackGroup()) {
			const tracks = trackGroup.getTracks();
			const htmlTrackGroup = this.#getSerializableElement(trackGroup);
			htmlTrackGroup.style.cssText = `--tracks:${tracks.length};`;
			this.#htmlContent?.append(htmlTrackGroup);

			for (const [id, track] of tracks.entries()) {
				const htmlTrack = this.#getSerializableElement(track);
				htmlTrack.style.cssText = `--start:${activeFilmClip.getStart()};--duration:${activeFilmClip.getDuration()};--track:${id};`;
				htmlTrackGroup.append(htmlTrack);

				for (const clip of track.getClips()) {
					const htmlClip = this.#getSerializableElement(clip);
					htmlClip.style.cssText = `--start:${clip.getStart()};--duration:${clip.getDuration()};--track:${id};`;
					htmlTrack.append(htmlClip);
				}
			}
		}
	}

	#getSerializableElement(element: Serializable): HTMLElement {
		let html = this.#elements.get(element);
		if (html) {
			return html;
		}

		switch (true) {
			case (element as SfmTrackGroup).isSfmTrackGroup:
				html = createElement('div', { class: 'trackgroup', });
				break;
			case (element as SfmTrack).isSfmTrack:
				html = createElement('div', { class: 'track', });
				break;
			case (element as SfmClip).isSfmClip:
				html = createElement('div', {
					class: `clip ${(element as SfmClip).getClipType()}-clip`,
					childs: [
						createElement('div', {
							class: 'clip-name',
							innerText: element.getName(),
						}),
						createElement('div', {
							class: 'resize-clip resize-clip-start',
							//style: `cursor: url('data:image/svg+xml,${encodeURIComponent(arrowMenuCloseSVG)}')12 12, col-resize;`,
							$mousedown: () => this.#startDragClipStart(element),
						}),
						createElement('div', {
							class: 'resize-clip resize-clip-end',
							//style: `cursor: url('data:image/svg+xml,${encodeURIComponent(arrowMenuOpenSVG)}')12 12, col-resize;`,
							$mousedown: () => this.#startDragClipEnd(element),
						}),
					]
				});
				break;
			default:
				throw new Error('code me ' + element.getTypeName());
		}
		return html;
	}

	#startDragClipStart(element: Serializable): void {
		this.#dragOperation = 'clipstart';
		this.#dragElement = element;
	}

	#startDragClipEnd(element: Serializable): void {
		this.#dragOperation = 'clipend';
		this.#dragElement = element;
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

	#handleMouseMove(event: MouseEvent): void {
		if (!this.#dragOperation) {
			return;
		}
		if ((event.buttons & 1) === 0) {// Primary button is not pressed
			this.#dragOperation = null;
			return;
		}

		// Compute mouse position relative to content
		const rect = this.#htmlContent!.getBoundingClientRect();
		const offsetX = event.clientX - rect.left;

		const time = (offsetX / (this.#timeUnit * this.#timeScale)) - this.#timeOffset;
		switch (this.#dragOperation) {
			case 'time':
				this.#setPlayPos(time);
				break;
			case 'clipstart':
				this.#setClipStart(time);
				break;
			case 'clipend':
				this.#setClipEnd(time);
				break;
			default:
				console.info('unsupported opertaion ' + this.#dragOperation);
				break;
		}
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
		Controller.dispatchEvent('usersetcurrenttime', { detail: playPos, });
	}

	#setClipStart(time: number): void {
		if (!this.#dragElement || !(this.#dragElement as SfmClip).isSfmClip) {
			return;
		}

		(this.#dragElement as SfmClip).setStart(time);
		this.refreshHTML();
	}

	#setClipEnd(time: number): void {
		//Controller.dispatchEvent('usersetcurrenttime', { detail: time, });
		if (!this.#dragElement || !(this.#dragElement as SfmClip).isSfmClip) {
			return;
		}

		(this.#dragElement as SfmClip).setEnd(time);
		this.refreshHTML();
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
