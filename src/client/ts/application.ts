import { Box, Repositories, Source1MaterialManager, Source1ModelManager, Source1ParticleControler, Source2ModelManager, WebRepository } from 'harmony-3d';
import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { JSONObject } from 'harmony-types';
import { documentStyle, I18n, I18nTranslation } from 'harmony-ui';
import htmlCSS from '../css/html.css';
import varsCSS from '../css/vars.css';
import english from '../json/i18n/english.json';
import french from '../json/i18n/french.json';
import optionsmanager from '../json/optionsmanager.json';
import { ALYX_REPOSITORY, CSGO_REPOSITORY, DEADLOCK_REPOSITORY, DOTA2_REPOSITORY, TF2_REPOSITORY } from './constants';
import { Controller } from './controller';
import { initGraphics, workCamera } from './graphics/graphics';
import { SfmCamera } from './model/camera';
import { SfmFilmClip } from './model/filmclip';
import { SfmSession } from './model/session';
import { SfmTrack } from './model/track';
import { SfmTrackGroup } from './model/trackgroup';
import { JSONFile, SfmSerializer } from './serialize/serializer';
import { AppPanel } from './view/app';

documentStyle(htmlCSS);
documentStyle(varsCSS);

class Application {
	static #main = new AppPanel();
	static #session = new SfmSession({ name: 'session' });
	static #translations = new Map<string, I18nTranslation>();

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
		Controller.addEventListener('usersavesession', () => save(this.#session));
		Controller.addEventListener('userselectcamera', (event) => {
			const clip = this.#session.getActiveFilmClip();
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

		Controller.addEventListener('useropenadvancedoptions', () => OptionsManager.showOptionsManager());
	}

	static #initOptions(): void {
		OptionsManagerEvents.addEventListener('app.lang', (event: Event) => this.#setLang((event as CustomEvent<OptionsManagerEvent<string>>).detail.value as string));


		OptionsManager.init({ json: optionsmanager });
	}

	static #initHTML() {
		//this.#main.getHTML();
	}

	static #addCamera(source: SfmCamera | null): void {
		const clip = this.#session.getActiveFilmClip();
		if (!clip) {
			return;
		}
		const sfmCamera = new SfmCamera({ name: `camera${clip.getCameras().size + 1}` });
		if (source) {
			sfmCamera.copy(source);
		}

		//const camera = new Camera({ name: sfmCamera.#name });
		//camera.copy(source?.getCamera() ?? workCamera.getCamera()!);
		//camera.setPosition([-10, clip.getCameras().size * 2, 0])
		//camera.addChild(new CameraFrustum());
		clip.addCamera(sfmCamera);
		clip.setActiveCamera(sfmCamera);
		//sfmCamera.setCamera(camera);

		//camera.addChild(new Text2D({ text: sfmCamera.getCamera().name }));

		Controller.dispatchEvent('cameraadded', {
			detail: {
				camera: sfmCamera,
				clip,
			}
		});
		Controller.dispatchEvent('setactivecamera', {
			detail: {
				camera: sfmCamera,
				clip,
			}
		});
	}

	static createNewSession(): void {
		this.#session = new SfmSession({ name: 'session' });

		const clip = new SfmFilmClip({ name: 'shot1' });
		clip.scene.getScene().addChild(new Box({ /*segments: 16, rings: 16*/ }));
		clip.scene.getScene().addChild(workCamera.getCamera());

		//this.#session.addClip(clip);
		this.#session.getFilm().addTrackGroup(new SfmTrackGroup({ name: 'Film' })).addTrack(new SfmTrack({ name: 'Film 1' })).addClip(clip);
		this.#session.setActiveFilmClip(clip);

		Controller.dispatchEvent('setactivefilmclip', { detail: clip });
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

	static #setLang(lang: string): void {
		this.#getLanguage(lang).then(json => {
			I18n.setOptions({ translations: [json as I18nTranslation] });
			I18n.setLang(lang);
		});
	}

	static async #getLanguage(lang: string): Promise<JSONObject> {
		const translation = this.#translations.get(lang);
		if (translation) {
			return translation;
		}

		const p = new Promise<JSONObject>(resolve => {
			void (async (): Promise<void> => {
				const response = await fetch(`/json/i18n/${lang}.json`);

				const json = await response.json();
				resolve(json);
			})();
		});
		this.#translations.set(lang, await p as I18nTranslation);
		return p;
	}
}

async function load(file: JSONFile) {
	/*
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
	*/


	//const json = JSON.parse(session) as JSONObject;
	const session = await SfmSerializer.unserializeJSON(file);
	console.info('load', session);
}

async function save(session: SfmSession) {
	const result = SfmSerializer.serializeJSON(session);
	console.info('save', result);

	load(result);

}
