import { Camera } from 'harmony-3d';
import { documentStyle, I18n } from 'harmony-ui';
import htmlCSS from '../css/html.css';
import varsCSS from '../css/vars.css';
import english from '../json/i18n/english.json';
import french from '../json/i18n/french.json';
import { Controller } from './controller';
import { initGraphics, workCamera } from './graphics/graphics';
import { Session } from './session/session';
import { AppPanel } from './view/app';


documentStyle(htmlCSS);
documentStyle(varsCSS);

class Application {
	static #main = new AppPanel();
	static #session = new Session();

	static {
		I18n.setOptions({ translations: [english, french] });
		I18n.start();
		this.#initListeners();
		this.#initHTML();
		this.#initOptions();
		initGraphics();
		this.createNewSession();
	}

	static #initListeners() {
		Controller.addEventListener('addcamera', (event) => this.#addCamera(event.detail));
	}

	static #initHTML() {
		//this.#main.getHTML();
	}

	static #initOptions() {
	}

	static #addCamera(source: Camera | null): void {
		const clip = this.#session.getActiveClip();
		const camera = new Camera({ name: `camera${clip.getCameras().size + 1}` });
		camera.copy(source ?? workCamera)
		clip.addCamera(camera);
		clip.setActiveCamera(camera);

		Controller.dispatchEvent('cameraadded', {
			detail: {
				camera,
				clip,
			}
		});
		Controller.dispatchEvent('setactivecamera', {
			detail: {
				camera,
				clip,
			}
		});
	}

	static createNewSession(): void {
		this.#session = new Session();

		Controller.dispatchEvent('setactiveclip', { detail: this.#session.getActiveClip() });
	}
}
