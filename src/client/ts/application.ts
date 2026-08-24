import { Camera, CameraFrustum, Repositories, Source1MaterialManager, Source1ModelManager, Source1ParticleControler, Source2ModelManager, Text2D, WebRepository } from 'harmony-3d';
import { documentStyle, I18n } from 'harmony-ui';
import htmlCSS from '../css/html.css';
import varsCSS from '../css/vars.css';
import english from '../json/i18n/english.json';
import french from '../json/i18n/french.json';
import { ALYX_REPOSITORY, CSGO_REPOSITORY, DEADLOCK_REPOSITORY, DOTA2_REPOSITORY, TF2_REPOSITORY } from './constants';
import { Controller } from './controller';
import { initGraphics, workCamera } from './graphics/graphics';
import { JSONFile, SFMSerializer } from './serialize/serializer';
import { Clip } from './session/clip';
import { Session } from './session/session';
import { AppPanel } from './view/app';


documentStyle(htmlCSS);
documentStyle(varsCSS);

class Application {
	static #main = new AppPanel();
	static #session = new Session({ name: 'session' });

	static {
		I18n.setOptions({ translations: [english, french] });
		this.#iniRepositories();
		I18n.start();
		this.#initListeners();
		this.#initHTML();
		this.#initOptions();
		initGraphics();
		this.createNewSession();

		//load();
		save(this.#session);
	}

	static #initListeners() {
		Controller.addEventListener('useraddcamera', (event) => this.#addCamera(event.detail));
		Controller.addEventListener('userselectcamera', (event) => {
			const clip = this.#session.getActiveClip();
			if (!clip) {
				return;
			}
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
		if (!clip) {
			return;
		}
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
		this.#session = new Session({ name: 'session' });

		const clip = new Clip({ name: 'shot1' });
		this.#session.addClip(clip);
		this.#session.setActiveClip(clip);

		Controller.dispatchEvent('setactiveclip', { detail: clip });
	}

	static #iniRepositories(): void {
		const tf2WebRepository = new WebRepository('tf2', TF2_REPOSITORY, true);
		Repositories.addRepository(tf2WebRepository);
		Repositories.addRepository(new WebRepository('dota2', DOTA2_REPOSITORY, true));
		Repositories.addRepository(new WebRepository('hla', ALYX_REPOSITORY, true));
		Repositories.addRepository(new WebRepository('cs2', CSGO_REPOSITORY, true));
		Repositories.addRepository(new WebRepository('deadlock', DEADLOCK_REPOSITORY, true));

		Source1ModelManager.loadManifest('tf2');
		Source1ParticleControler.loadManifest('tf2');
		Source1MaterialManager.addRepository('tf2');
		Source2ModelManager.loadManifest('dota2');
		Source2ModelManager.loadManifest('hla');
		Source2ModelManager.loadManifest('cs2');
		Source2ModelManager.loadManifest('deadlock');

		tf2WebRepository.supportedExtensions.add('vmt');
		tf2WebRepository.supportedExtensions.add('vtf');

		fetch(TF2_REPOSITORY + `materials_manifest.json?t=${new Date().getTime()}`).then(async (response) => {
			const j = await response.json();
			if (!j) {
				return;
			}

			tf2WebRepository.setFiles(j);
		});
	}
}

async function load() {
	const session: JSONFile =
	{
		"file_infos": {
		},
		"session": "5f41e251-520b-4e64-8815-37f215c98c81",
		"elements": [
			{
				"id": "5f41e251-520b-4e64-8815-37f215c98c81",
				"name": "session",
				"type": "Session",
			}
		],
	};


	//const json = JSON.parse(session) as JSONObject;
	const root = await SFMSerializer.fromJSON(session);
	console.info(root);

	const result = SFMSerializer.serializeJSON(root as Session);
	console.info(result);

}

async function save(session: Session) {
	const result = SFMSerializer.serializeJSON(session);
	console.info(result);

}
