import { createElement, defineHarmonySwitch, HTMLHarmonyToggleButtonElement } from 'harmony-ui';
import renderCSS from '../../css/render.css';
import { Controller } from '../controller';
import { Panel } from './panel';

export class RenderPanel extends Panel {
	#canvasContainer?: HTMLElement;

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({
			size: 3,
			layout: 'column',
			floating: true,
			closable: true,
			width: 80,
			height: 80,
			titleI18n: '#render',
			adoptStyle: renderCSS,
		});

		defineHarmonySwitch();
		createElement('harmony-switch', {
			'data-i18n': '#render',
			parent: this.panel!.getContent(),
			state: '1',
			$change: (event: Event) => {
				if ((event.target as HTMLHarmonyToggleButtonElement).state) {
					Controller.dispatchEvent('userresumerender');
				} else {
					Controller.dispatchEvent('userpauserender');
				}
			},
		}) as HTMLHarmonyToggleButtonElement;

		this.#canvasContainer = createElement('div', {
			parent: this.panel!.getContent(),
			class: 'canvas-container',
		});
	}

	setCanvas(canvas: HTMLCanvasElement): void {
		this.initPanel();

		this.open();

		this.#canvasContainer!.replaceChildren(canvas);
	}
}
