import { ShortcutHandler } from 'harmony-browser-utils';
import { createElement } from 'harmony-ui';
import { Map2 } from 'harmony-utils';
import timelineCSS from '../../css/timeline.css';
import { Controller } from '../controller';
import { SfmClip } from '../model/clips/clip';
import { SfmFilmClip } from '../model/clips/filmclip';
import { SfmTrack } from '../model/track';
import { SfmTrackGroup } from '../model/trackgroup';
import { Serializable } from '../serialize/serializable';
import { Panel } from './panel';

type DragOperation = 'time' | 'clipstart' | 'clipend' | 'moveclip';

export class TimelinePanel extends Panel {
	// Current clip displayed in the timeline
	#selectedClips = new Set<SfmClip>;
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
	#elementsOuter = new Map<Serializable, HTMLElement>();
	#elementsInner = new Map<Serializable, HTMLElement>();
	#dragOperation: DragOperation | null = null;
	#dragElement: Serializable | null = null;
	#dragTime = 0;
	#dragStart = 0;
	#dragEnd = 0;

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, layout: 'column', adoptStyle: timelineCSS, titleI18n: '#timeline', tabIndex: '1', });
		//this.panel!.append('TimelinePanel');

		const panelContent = this.panel!.getContent();

		panelContent.addEventListener('wheel', (event: WheelEvent) => this.#mouseWheel(event));

		for (let i = 0; i < 2; i++) {
			this.#htmlTimeTracks[i] = createElement('div', {
				parent: panelContent,
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
			parent: panelContent,
			class: 'head',
		});

		ShortcutHandler.addContext('timeline', this.panel!.getContent());

		ShortcutHandler.addEventListener('app.shortcuts.timeline.blade', () => this.#bladeClip());

		this.#setCssVars();
	}

	constructor() {
		super();
		Controller.addEventListener('setactivefilmclip', (event) => this.#setActiveFilmClip(event.detail));
		Controller.addEventListener('setcurrentclip', (event) => this.#setSelectedClip(event.detail));
		Controller.addEventListener('setcurrenttime', (event) => this.#setCurrentTime(event.detail));
	}

	#setActiveFilmClip(clip: SfmFilmClip): void {
		this.#activeFilmClip = clip;
		this.refreshHTML();
	}

	#addSelectedClip(clip: SfmClip): void {
		this.#selectedClips.add(clip);
		console.info(clip);
		const [outer] = this.#getSerializableElement(clip);
		outer.classList.add('active');
		this.refreshHTML();
	}

	#setSelectedClip(clip: SfmClip): void {
		for (const selected of this.#selectedClips) {
			const [outer] = this.#getSerializableElement(selected);
			outer.classList.remove('active');

		}
		this.#selectedClips.clear();

		this.#selectedClips.add(clip);
		console.info(clip);
		const [outer] = this.#getSerializableElement(clip);
		outer.classList.add('active');
		this.refreshHTML();
	}

	protected refreshHTML(): void {
		this.#htmlContent?.replaceChildren();
		const activeFilmClip = this.#activeFilmClip;
		if (!activeFilmClip) {
			return;
		}

		const posPerTrack = new Map2<SfmTrack, number, number>();

		function getClipRow(clip: SfmClip): number {
			const track = clip.track;
			if (!track) {
				return 0;
			}

			const clipEnd = clip.getEnd();
			const a = posPerTrack.getSubMap(track);
			if (a === undefined) {
				posPerTrack.set(track, 0, clipEnd);
				return 0;
			}

			let lastRow = 0;
			for (const [row, endTime] of a) {
				if (clipEnd >= endTime) {
					a.set(row, clipEnd);
					return row;
				}
				lastRow = row;
			}

			++lastRow;

			posPerTrack.set(track, lastRow, clipEnd);
			return lastRow;
		}

		for (const trackGroup of activeFilmClip.getTrackGroup()) {
			const tracks = trackGroup.getTracks();
			const [htmlTrackGroup] = this.#getSerializableElement(trackGroup);
			htmlTrackGroup.style.cssText = `--tracks:${tracks.length};`;
			this.#htmlContent?.append(htmlTrackGroup);

			for (const [id, track] of tracks.entries()) {
				const [htmlTrackOuter, htmlTrackInner] = this.#getSerializableElement(track);
				htmlTrackOuter.style.cssText = `--start:${activeFilmClip.getStart()};--duration:${activeFilmClip.getDuration()};--track:${id};`;
				htmlTrackGroup.append(htmlTrackOuter);

				let maxRow = -1;
				for (const clip of track.getClips()) {
					const [htmlClip] = this.#getSerializableElement(clip);
					const row = getClipRow(clip);
					maxRow = Math.max(row, maxRow);
					htmlClip.style.cssText = `--start:${clip.getStart()};--duration:${clip.getDuration()};--row:${row}`;
					htmlTrackInner.append(htmlClip);
				}

				htmlTrackInner.style.cssText = `--rows:${maxRow + 1};`;
			}
		}
	}

	#getSerializableElement(element: Serializable): [HTMLElement, HTMLElement] {
		let outer = this.#elementsOuter.get(element);
		let inner = this.#elementsInner.get(element);
		if (outer && inner) {
			return [outer, inner];
		}

		switch (true) {
			case (element as SfmTrackGroup).isSfmTrackGroup:
				inner = outer = createElement('div', { class: 'trackgroup', });
				break;
			case (element as SfmTrack).isSfmTrack:
				outer = createElement('div', {
					class: 'track',
					childs: [
						createElement('div', {
							innerText: element.getName(),
						}),
						inner = createElement('div', {
							class: 'clip-container',
						}),
					],
				});
				break;
			case (element as SfmClip).isSfmClip:
				inner = outer = createElement('div', {
					class: `clip ${(element as SfmClip).getClipType()}-clip`,
					childs: [
						createElement('div', {
							class: 'clip-header',
							innerText: element.getName(),
							$mousedown: (event: MouseEvent) => {
								this.#dragOperation = 'moveclip';
								this.#dragElement = element;
								this.#dragTime = this.#getTimeFromMouseEvent(event);
								this.#dragStart = (element as SfmClip).getStart();
								this.#dragEnd = (element as SfmClip).getEnd();
								console.info(this.#dragTime);
							}
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
					],
					$click: (event: MouseEvent) => this.#clipMouseDownOrClick(event, element),
					$mousedown: (event: MouseEvent) => this.#clipMouseDownOrClick(event, element),
				});
				break;
			default:
				throw new Error('code me ' + element.getTypeName());
		}


		this.#elementsOuter.set(element, outer);
		this.#elementsInner.set(element, inner);
		return [outer, inner];
	}

	#clipMouseDownOrClick(event: MouseEvent, element: Serializable): void {
		if (event.ctrlKey) {
			this.#addSelectedClip(element as SfmClip);
		} else {
			this.#setSelectedClip(element as SfmClip);
		}

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

		const time = this.#getTimeFromMouseEvent(event);//(offsetX / (this.#timeUnit * this.#timeScale)) - this.#timeOffset;
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
			case 'moveclip':
				//this.#setClipEnd(time);
				if (this.#dragElement) {
					const delta = time - this.#dragTime;
					(this.#dragElement as SfmClip).setStart(delta + this.#dragStart);
					(this.#dragElement as SfmClip).setEnd(delta + this.#dragEnd);
					this.refreshHTML();
				}
				break;
			default:
				console.info('unsupported opertaion ' + this.#dragOperation);
				break;
		}
	}

	#getTimeFromMouseEvent(event: MouseEvent): number {
		// Compute mouse position relative to content
		const rect = this.#htmlContent!.getBoundingClientRect();
		const offsetX = event.clientX - rect.left;

		return (offsetX / (this.#timeUnit * this.#timeScale)) - this.#timeOffset;
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

	#bladeClip(): void {
		const time = this.#playHeadPos;
		for (const selected of this.#selectedClips) {
			if (!selected.track) {
				continue;
			}

			if (!selected.inTimeFrame(this.#playHeadPos)) {
				return;
			}

			const end = selected.getEnd();

			// Prevents blading at the very start or very end
			if (selected.getStart() === time || end === time) {
				return;
			}

			selected.setEnd(this.#playHeadPos);
			const newCLip = selected.createClip();
			newCLip.setStart(this.#playHeadPos);
			newCLip.setEnd(end);
			selected.track.addClip(newCLip);
			this.#addSelectedClip(newCLip);
		}
		this.refreshHTML();
	}
}
