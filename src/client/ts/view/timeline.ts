import { ShortcutHandler } from 'harmony-browser-utils';
import { createElement, defineHarmonyMenu, HarmonyMenuItemsDict, HTMLHarmonyMenuElement } from 'harmony-ui';
import { Map2 } from 'harmony-utils';
import timelineCSS from '../../css/timeline.css';
import { Controller } from '../controller';
import { Action } from '../history/action';
import { History } from '../history/history';
import { SfmClip } from '../model/clips/clip';
import { SfmFilmClip } from '../model/clips/filmclip';
import { SfmSoundClip } from '../model/clips/soundclip';
import { SfmTimeFrame } from '../model/timeframe';
import { SfmTrack } from '../model/track';
import { SfmTrackGroup } from '../model/trackgroup';
import { Serializable } from '../serialize/serializable';
import { Panel } from './panel';

type DragOperation = 'time' | 'clipstart' | 'clipend' | 'moveclip';

export class TimelinePanel extends Panel {
	// Current clip displayed in the timeline
	#selectedClips = new Set<SfmClip>;
	// Selected sub clip
	#topFilmClip: SfmFilmClip | null = null;
	#playHeadPos = 0;
	#htmlTracks = new WeakMap<SfmTrack, HTMLElement>();
	#htmlContent?: HTMLElement;
	#htmlTimeTracks: HTMLElement[] = [];
	#htmlPlayHead?: HTMLElement;
	#htmlContextMenu?: HTMLHarmonyMenuElement;

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
	#dragAction: Action | null = null;
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
		panelContent.addEventListener('mouseup', () => this.#commitDragOperation());

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

		defineHarmonyMenu();
		this.#htmlContextMenu = createElement('harmony-menu') as HTMLHarmonyMenuElement;

		ShortcutHandler.addContext('timeline', this.panel!.getContent());

		ShortcutHandler.addEventListener('app.shortcuts.timeline.blade', () => this.#bladeClips());

		this.#setCssVars();
	}

	constructor() {
		super();
		Controller.addEventListener('settopfilmclip', (event) => this.#setTopFilmClip(event.detail));
		Controller.addEventListener('setcurrentclip', (event) => this.#setSelectedClip(event.detail));
		Controller.addEventListener('setcurrenttime', (event) => this.#setCurrentTime(event.detail));
		Controller.addEventListener('refreshtimeline', () => this.refreshHTML());
	}

	#setTopFilmClip(clip: SfmFilmClip): void {
		this.#topFilmClip = clip;
		this.refreshHTML();
	}

	#addSelectedClip(clip: SfmClip): void {
		this.#selectedClips.add(clip);
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
		const [outer] = this.#getSerializableElement(clip);
		outer.classList.add('active');
		this.refreshHTML();
	}

	protected refreshHTML(): void {
		this.#htmlContent?.replaceChildren();
		const topFilmClip = this.#topFilmClip;
		if (!topFilmClip) {
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
				if (clip.getStart() >= endTime) {
					a.set(row, clipEnd);
					return row;
				}
				lastRow = row;
			}

			++lastRow;

			posPerTrack.set(track, lastRow, clipEnd);
			return lastRow;
		}

		for (const trackGroup of topFilmClip.getTrackGroup()) {
			const tracks = trackGroup.getTracks();
			const [htmlTrackGroup] = this.#getSerializableElement(trackGroup);
			htmlTrackGroup.style.cssText = `--tracks:${tracks.length};`;
			this.#htmlContent?.append(htmlTrackGroup);
			htmlTrackGroup.replaceChildren();

			for (const [id, track] of tracks.entries()) {
				const [htmlTrackOuter, htmlTrackInner] = this.#getSerializableElement(track);
				htmlTrackOuter.style.cssText = `--start:${topFilmClip.getStart()};--duration:${topFilmClip.getDuration()};--track:${id};`;
				htmlTrackGroup.append(htmlTrackOuter);
				htmlTrackInner.replaceChildren();

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
					$contextmenu: (event: MouseEvent) => this.#displayTrackContextMenu(event, element as SfmTrack),
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
								this.#startDragOperation('moveclip', element);
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
		this.#startDragOperation('clipstart', element);
	}

	#startDragClipEnd(element: Serializable): void {
		this.#startDragOperation('clipend', element);
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
					if (this.#dragAction) {
						this.#dragAction.do(this.#dragElement as SfmClip, 'set-start', delta + this.#dragStart);//(this.#dragElement as SfmClip).setStart(delta + this.#dragStart);
						this.#dragAction.do(this.#dragElement as SfmClip, 'set-end', delta + this.#dragEnd);//(this.#dragElement as SfmClip).setEnd(delta + this.#dragEnd);
					}
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

		this.#dragAction?.do(this.#dragElement as SfmClip, 'set-start', time);//(this.#dragElement as SfmClip).setStart(time);

		this.refreshHTML();
	}

	#setClipEnd(time: number): void {
		//Controller.dispatchEvent('usersetcurrenttime', { detail: time, });
		if (!this.#dragElement || !(this.#dragElement as SfmClip).isSfmClip) {
			return;
		}

		this.#dragAction?.do(this.#dragElement as SfmClip, 'set-end', time);//(this.#dragElement as SfmClip).setEnd(time);
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

	#bladeClips(): void {
		const action = History.startAction();
		const time = this.#playHeadPos;
		for (const selected of new Set(this.#selectedClips)) {// We create a copy as we update the original set
			if (!selected.track) {
				continue;
			}

			if (!selected.inTimeFrame(time)) {
				continue;
			}

			const end = selected.getEnd();

			// Prevents blading at the very start or very end
			if (selected.getStart() === time || end === time) {
				continue;
			}

			action.do(selected, 'set-end', time);//selected.setEnd(time);

			const newCLip = selected.createClip(selected.getNextName());
			action.do(newCLip, 'set-start', time);//newCLip.setStart(time);
			action.do(newCLip, 'set-end', end);//newCLip.setEnd(end);
			action.do(selected.track, 'add-clip', newCLip);//selected.track.addClip(newCLip);
			this.#addSelectedClip(newCLip);
		}
		History.commit(action);
		this.refreshHTML();
	}

	#startDragOperation(operation: DragOperation, element: Serializable): void {
		this.#dragOperation = operation;
		this.#dragElement = element;

		if (operation === 'clipstart' || operation === 'clipend' || operation === 'moveclip') {
			this.#dragAction = History.startAction();
		}
	}

	#commitDragOperation(): void {
		if (!this.#dragAction) {
			return;
		}
		History.commit(this.#dragAction);
		this.#dragAction = null;
	}

	#displayTrackContextMenu(event: MouseEvent, track: SfmTrack): void {
		if (event.shiftKey || !this.#htmlContextMenu) {
			return;
		}

		const contextMenu: HarmonyMenuItemsDict = {
			add_clip: { i18n: '#add_clip', f: (): void => this.#addClipToTrack(track) },
			...(track.getTrackType() === 'film') && { fill_gaps: { i18n: '#fill_gaps', f: (): void => this.#fillGaps(track) } },
		};
		this.#htmlContextMenu.showContextual(contextMenu, event.clientX, event.clientY, track);

		//SceneExplorerEntity.#explorer?.showContextMenu(event.clientX, event.clientY, this.#entity);
		event.preventDefault();
		event.stopPropagation();
	}

	#addClipToTrack(track: SfmTrack): void {
		const action = History.startAction();

		let newCLip: SfmClip;
		switch (track.getTrackType()) {
			case 'film':
				newCLip = new SfmFilmClip();
				break;
			case 'sound':
				// TODO: add sound selection
				newCLip = new SfmSoundClip();
				break;
			default:
				throw new Error('code me ' + track.getTrackType());
		}

		action.do(track, 'add-clip', newCLip);
		//action.do(newCLip, 'set-start', time);//newCLip.setStart(time);
		History.commit(action);
		this.#setSelectedClip(newCLip);
		this.refreshHTML();
	}

	#fillGaps(track: SfmTrack): void {
		const action = History.startAction();


		const timeFrame = track.trackGroup?.parentClip?.getTimeFrame();

		const gaps = track.getGaps(timeFrame?.getStart() ?? -Infinity, timeFrame?.getEnd() ?? Infinity);
		console.info(gaps);
		for (const gap of gaps) {
			console.info(gap.getStart(), gap.getEnd());
			const clip = createClip(track, gap);
			action.do(clip, 'set-name', 'slug');
			action.do(track, 'add-clip', clip);
		}

		History.commit(action);
		this.refreshHTML();
	}
}

function createClip(track: SfmTrack, timeFrame: SfmTimeFrame): SfmClip {
	const start = timeFrame.getStart();
	const end = timeFrame.getEnd();
	switch (track.getTrackType()) {
		case 'film':
			return new SfmFilmClip({ timeFrame: { start, end } });
		case 'sound':
			// TODO: add sound selection
			return new SfmSoundClip({ timeFrame: { start, end } });
			break;
		default:
			throw new Error('code me ' + track.getTrackType());
	}

}
