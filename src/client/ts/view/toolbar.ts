import { addSVG, fileOpenSVG, manufacturingSVG, redoSVG, saveSVG, settingsSVG, undoSVG } from 'harmony-svg';
import { createElement } from 'harmony-ui';
import toolbarCSS from '../../css/toolbar.css';
import { Controller, RefreshToolbar } from '../controller';
import { Panel } from './panel';

export class Toolbar extends Panel {
	#htmlAddCharacterButton?: HTMLButtonElement;
	#htmlUndoButton?: HTMLButtonElement;
	#htmlRedoButton?: HTMLButtonElement;

	constructor() {
		super();
		Controller.addEventListener('refreshtoolbar', (event) => this.#refresh(event.detail));
	}

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 0, adoptStyle: toolbarCSS });
		this.panel!.setCollapsible(false);

		createElement('div', {
			parent: this.panel!.getContent(),
			childs: [
				createElement('button', {
					innerHTML: fileOpenSVG,
					$click: () => {
						//Controller.dispatchEvent('useraddcamera', { detail: this.#useWorkCamera ? workCamera : this.#activeClip?.activeCamera ?? null });
						//this.#useWorkCamera = false;
					},
				}) as HTMLButtonElement,
				createElement('button', {
					innerHTML: saveSVG,
					$click: () => {
						Controller.dispatchEvent('usersavesession');
					},
				}) as HTMLButtonElement,
				createElement('button', {
					innerHTML: settingsSVG,
					$click: () => {
						Controller.dispatchEvent('useropenoptions');
					},
				}) as HTMLButtonElement,
				createElement('button', {
					innerHTML: manufacturingSVG,
					$click: () => {
						Controller.dispatchEvent('useropenadvancedoptions');
					},
				}) as HTMLButtonElement,
				createElement('button', {
					innerHTML: addSVG,
					$click: () => {
						Controller.dispatchEvent('useraddmodel');
					},
				}) as HTMLButtonElement,
				this.#htmlAddCharacterButton = createElement('button', {
					innerHTML: addSVG,
					disabled: true,
					$click: () => {
						Controller.dispatchEvent('userselectcharacter');
					},
				}) as HTMLButtonElement,
				this.#htmlUndoButton = createElement('button', {
					innerHTML: undoSVG,
					disabled: true,
					$click: () => {
						Controller.dispatchEvent('userundolastaction');
					},
				}) as HTMLButtonElement,
				this.#htmlRedoButton = createElement('button', {
					innerHTML: redoSVG,
					disabled: true,
					$click: () => {
						Controller.dispatchEvent('userredolastaction');
					},
				}) as HTMLButtonElement,
			],
		});

		//this.#refresh();
	}

	#refresh(params: RefreshToolbar): void {
		this.initPanel();
		if (params.addCharacter !== undefined) {
			this.#htmlAddCharacterButton!.disabled = !params.addCharacter;
		}
		if (params.undoButton !== undefined) {
			this.#htmlUndoButton!.disabled = !params.undoButton;
		}
		if (params.redoButton !== undefined) {
			this.#htmlRedoButton!.disabled = !params.redoButton;
		}
	}

}
