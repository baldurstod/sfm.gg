import { addSVG, fileOpenSVG, manufacturingSVG, saveSVG, settingsSVG, undoSVG } from 'harmony-svg';
import { createElement } from 'harmony-ui';
import toolbarCSS from '../../css/toolbar.css';
import { Controller } from '../controller';
import { Panel } from './panel';

export class Toolbar extends Panel {
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
				createElement('button', {
					innerHTML: addSVG,
					$click: () => {
						Controller.dispatchEvent('userselectcharacter');
					},
				}) as HTMLButtonElement,
				createElement('button', {
					innerHTML: undoSVG,
					$click: () => {
						Controller.dispatchEvent('userundolastaction');
					},
				}) as HTMLButtonElement,
			],
		});
	}
}
