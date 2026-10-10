import { createElement, updateElement } from 'harmony-ui';
import statusbarCSS from '../../css/statusbar.css';
import { Controller } from '../controller';
import { SfmClip } from '../model/clips/clip';
import { Panel } from './panel';

export class StatusBar extends Panel {
	#htmlSelectedClip?: HTMLElement;
	#selectedClip?: SfmClip;


	constructor() {
		super();

		Controller.addEventListener('usersetselectedclip', (event) => this.#setSelectedClip(event.detail.selected));
		Controller.addEventListener('clipupdated', (event) => this.#setSelectedClip(event.detail));
	}

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 0, adoptStyle: statusbarCSS });

		this.#htmlSelectedClip = createElement('span', {
			parent: this.panel!.getContent(),
			class: 'selected-clip',
			innerText: ' ',
		});
	}

	#setSelectedClip(clip: SfmClip): void {
		this.initPanel();
		console.info(clip);

		updateElement(this.#htmlSelectedClip, {
			i18n: {
				innerText: '#status_bar_clip',
				values: {
					name: clip.getName(),
					start: clip.getTimeFrame().getStart(),
					duration: clip.getTimeFrame().getDuration(),
				},
			},
		});
	}
}
