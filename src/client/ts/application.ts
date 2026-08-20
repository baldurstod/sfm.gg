import { Camera, CameraFrustum, Text2D } from 'harmony-3d';
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
		Controller.addEventListener('useraddcamera', (event) => this.#addCamera(event.detail));
		Controller.addEventListener('userselectcamera', (event) => {
			const clip = this.#session.getActiveClip();
			const camera = event.detail;

			// Check if the camera if part of the current clip
			if (!clip.hasCamera(camera)) {
				return;
			}

			Controller.dispatchEvent('setactivecamera', {
				detail: {
					camera,
					clip,
				}
			});
		});
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
		camera.setPosition([-10, clip.getCameras().size * 2, 0])
		camera.addChild(new CameraFrustum());
		clip.addCamera(camera);
		clip.setActiveCamera(camera);

		camera.addChild(new Text2D({ text: camera.name }));

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
