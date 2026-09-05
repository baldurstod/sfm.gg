import { Repositories, Source1MaterialManager, Source1ModelManager, Source1ParticleControler, Source2ModelManager, WebRepository } from 'harmony-3d';
import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents, ShortcutHandler } from 'harmony-browser-utils';
import { JSONObject } from 'harmony-types';
import { documentStyle, I18n, I18nTranslation } from 'harmony-ui';
import htmlCSS from '../css/html.css';
import varsCSS from '../css/vars.css';
import english from '../json/i18n/english.json';
import french from '../json/i18n/french.json';
import optionsmanager from '../json/optionsmanager.json';
import { ALYX_REPOSITORY, CSGO_REPOSITORY, DEADLOCK_REPOSITORY, DOTA2_REPOSITORY, TF2_REPOSITORY } from './constants';
import { AddCharacter, Controller, SetSelectedClip } from './controller';
import { initGraphics, workCamera } from './graphics/graphics';
import { Command } from './history/action';
import { History } from './history/history';
import { characterToModel, getTf2Characters } from './misc/character';
import { SfmCamera } from './model/camera';
import { SfmFilmClip } from './model/clips/filmclip';
import { SfmSoundClip } from './model/clips/soundclip';
import { SfmNode } from './model/node';
import { SfmPrimitiveBox } from './model/primitives/box';
import { SfmScene } from './model/scene';
import { SfmSession } from './model/session';
import { SfmTrack } from './model/track';
import { SfmTrackGroup } from './model/trackgroup';
import { Player } from './player';
import { JSONFile, SfmSerializer } from './serialize/serializer';
import { AppPanel } from './view/app';
import { CharacterSelectorPanel } from './view/characterselector';
import { ModelSelectorPanel } from './view/modelselector';

documentStyle(htmlCSS);
documentStyle(varsCSS);

class Application {
	static #main = new AppPanel();
	static #session = new SfmSession();
	static #translations = new Map<string, I18nTranslation>();
	static #modelSelectorPanel?: ModelSelectorPanel;
	static #characterSelectorPanel?: CharacterSelectorPanel;
	static #player = new Player();

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
			const clip = this.#session.getTopFilmClip();
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
		Controller.addEventListener('useraddmodel', () => this.#userAddModel());
		Controller.addEventListener('userselectcharacter', () => this.#userselectCharacter());
		Controller.addEventListener('userselectcharacterselectapp', (event) => this.#userSelectCharacterSelectApp(event.detail));
		Controller.addEventListener('useraddcharacter', (event) => this.#userAddCharacter(event.detail));
		Controller.addEventListener('usergotopreviousframe', () => this.#userPreviousFrame());
		Controller.addEventListener('usergotonextframe', () => this.#userNextFrame());
		Controller.addEventListener('usersetcurrenttime', (event) => this.#userSetTime(event.detail));
		Controller.addEventListener('usersetplaying', (event) => this.#setPlaying(event.detail));
		Controller.addEventListener('userundolastaction', () => this.#undo());
		Controller.addEventListener('userredolastaction', () => this.#redo());
		Controller.addEventListener('useraddselectedclip', (event) => this.#addSelectedClip(event.detail));
		Controller.addEventListener('usersetselectedclip', (event) => this.#setSelectedClip(event.detail));

		//Controller.dispatchEvent('userselectcharacter');
		//Controller.dispatchEvent('userselectcharacterselectapp', { detail: 440, });
	}

	static #initOptions(): void {
		OptionsManagerEvents.addEventListener('app.lang', (event: Event) => this.#setLang((event as CustomEvent<OptionsManagerEvent<string>>).detail.value as string));

		OptionsManager.init({ json: optionsmanager });
		(async () => ShortcutHandler.setShortcuts('timeline', await OptionsManager.getOptionsPerType('shortcut') as Map<string, string>))()
	}

	static #initHTML() {
		//this.#main.getHTML();
	}

	static #addCamera(source: SfmCamera | null): void {
		const clip = this.#session.getTopFilmClip();
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

		const film = new SfmFilmClip({ name: 'Film' });
		this.#session.setTopFilmClip(film);


		const clip = new SfmFilmClip({ name: 'shot1', scene: new SfmScene(), timeFrame: { start: 0, end: 15 }, });
		const clip2 = new SfmFilmClip({ name: 'shot2', scene: new SfmScene(), timeFrame: { start: 25, end: 35 }, });
		//clip.scene.getScene().addChild(new Box({ /*segments: 16, rings: 16*/ }));
		clip.scene!.addChild(new SfmNode())!.entity = new SfmPrimitiveBox();
		clip.scene!.getScene().addChild(workCamera.getCamera());

		//this.#session.addClip(clip);
		//film.addTrackGroup(new SfmTrackGroup({ name: 'Film' })).addTrack(new SfmTrack({ name: 'Film 1', trackType: 'film' })).addClip(clip);
		const filmTrackGroup = new SfmTrackGroup({ name: 'Film' });
		film.do(new Command(film, 'add-track-group', filmTrackGroup));//const filmTrackGroup = film.addTrackGroup(new SfmTrackGroup({ name: 'Film' }));
		const filmTrack = new SfmTrack({ name: 'Film 1', trackType: 'film' });
		//const filmTrack = .addTrack(new SfmTrack({ name: 'Film 1', trackType: 'film' }));
		filmTrackGroup.do(new Command(filmTrackGroup, 'add-track', filmTrack));
		filmTrack.do(new Command(filmTrack, 'add-clip', clip));
		filmTrack.do(new Command(filmTrack, 'add-clip', clip2));

		const dialog = new SfmTrack({ name: 'Dialog', trackType: 'sound' })
		const music = new SfmTrack({ name: 'Music', trackType: 'sound', });
		const soundTrackGroup = new SfmTrackGroup({ name: 'Sounds' });
		film.do(new Command(film, 'add-track-group', soundTrackGroup));/*film.addTrackGroup(soundTrackGroup/*new SfmTrackGroup({ name: 'Sounds' })).addTracks([
			dialog = new SfmTrack({ name: 'Dialog', trackType: 'sound' }),
			music = new SfmTrack({ name: 'Music', trackType: 'sound', }),
		]* /);*/
		soundTrackGroup.do(new Command(soundTrackGroup, 'add-track', dialog));
		soundTrackGroup.do(new Command(soundTrackGroup, 'add-track', music));

		dialog.do(new Command(dialog, 'add-clip', new SfmSoundClip({ timeFrame: { start: 10, end: 1 } })));//dialog.addClip(new SfmSoundClip({ timeFrame: { start: 10, end: 1 } }));
		dialog.do(new Command(dialog, 'add-clip', new SfmSoundClip({ timeFrame: { end: 0.5 } })));//dialog.addClip(new SfmSoundClip({ timeFrame: { end: 0.5 } }));
		dialog.do(new Command(dialog, 'add-clip', new SfmSoundClip({ name: 'music1' })));//music.addClip(new SfmSoundClip({ name: 'music1' }));

		this.#player.setFilmClip(film);

		Controller.dispatchEvent('settopfilmclip', { detail: film });
		Controller.dispatchEvent('viewelement', { detail: this.#session });
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

	static #userAddModel(): void {
		if (!this.#modelSelectorPanel) {
			this.#modelSelectorPanel = new ModelSelectorPanel();
		}

		this.#modelSelectorPanel.open();
	}

	static #userselectCharacter(): void {
		const topClip = this.#session.getTopFilmClip();
		if (!topClip) {
			return;
		}

		const primary = topClip.getPrimarySelectedClip();
		const selected = topClip.getSelectedClips();
		if (!primary) {
			return;
		}

		this.#getCharacterSelectorPanel().selectCharacter(primary, selected);
	}

	static #getCharacterSelectorPanel(): CharacterSelectorPanel {
		if (!this.#characterSelectorPanel) {
			this.#characterSelectorPanel = new CharacterSelectorPanel();
		}
		return this.#characterSelectorPanel;
	}

	static #userSelectCharacterSelectApp(appId: number): void {
		switch (appId) {
			case 440:
				this.#getCharacterSelectorPanel().setCharacters(getTf2Characters());
				break;

			default:
				throw new Error(`Unknown app id ${appId}`);
		}
	}

	static async #userAddCharacter(detail: AddCharacter): Promise<void> {
		const scenes = new Set<SfmScene>();
		for (const clip of detail.clips) {
			const sfmScene = clip.scene;
			if (sfmScene) {
				scenes.add(sfmScene);
			}
		}

		for (const scene of scenes) {
			scene.getScene().addChild(await characterToModel(detail.character));
		}
	}

	static #userPreviousFrame(): void {
		Controller.dispatchEvent('usersetplaying', { detail: false });
		this.#player.previousFrame();
		this.#updateCurrentTime();
	}

	static #userNextFrame(): void {
		Controller.dispatchEvent('usersetplaying', { detail: false });
		this.#player.nextFrame();
		this.#updateCurrentTime();
	}

	static #userSetTime(time: number): void {
		Controller.dispatchEvent('usersetplaying', { detail: false });
		this.#player.setCurrentTime(time);
		this.#updateCurrentTime();
		/*
		this.#player.nextFrame();
		this.#setCurrentTime();
		*/
	}

	static #updateCurrentTime(): void {
		Controller.dispatchEvent('setcurrenttime', { detail: this.#player.getCurrentTime() });
	}

	static #setPlaying(playing: boolean): void {
		this.#player.setPlaying(playing);
	}

	static #undo(): void {
		History.undo();
		Controller.dispatchEvent('refreshtimeline');
	}

	static #redo(): void {
		History.redo();
		Controller.dispatchEvent('refreshtimeline');
	}

	static #addSelectedClip(detail: SetSelectedClip): void {
		const action = History.startAction();
		action.do(detail.topClip, 'add-selected-clip', detail.selected);
		History.commit(action);
		Controller.dispatchEvent('refreshtimeline');
		Controller.dispatchEvent('refreshtoolbar', { detail: { addCharacter: true, } });
	}

	static #setSelectedClip(detail: SetSelectedClip): void {
		const action = History.startAction();
		action.do(detail.topClip, 'set-selected-clip', detail.selected);
		History.commit(action);
		Controller.dispatchEvent('refreshtimeline');
		Controller.dispatchEvent('refreshtoolbar', { detail: { addCharacter: true, } });
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

	/*


	session = new SfmSession({ name: 'session' });
	const topFilmClip = session.getTopFilmClip();
	if (topFilmClip?.scene) {
		topFilmClip.scene.addChild(new SfmNode())!.entity = new SfmPrimitiveBox();
	}

	session = new SfmSession({ name: 'session' });

	const film = new SfmFilmClip({ name: 'Film' });
	session.setTopFilmClip(film);

	const clip = new SfmFilmClip({ name: 'shot1', scene: new SfmScene(), });
	clip.scene!.getScene().addChild(new Box({ /*segments: 16, rings: 16* / }));
	clip.scene!.getScene().addChild(workCamera.getCamera());
	clip.scene!.addChild(new SfmNode())!.entity = new SfmPrimitiveBox();

	const operatorsTrackGroup = new SfmTrackGroup({ name: 'Operators' });
	clip.do(new Command(clip, 'add-track-group', operatorsTrackGroup));//const operatorsTrackGroup = clip.addTrackGroup(new SfmTrackGroup({ name: 'Operators' }));
	const operatorsTrack = new SfmTrack({ name: 'Operators', trackType: 'operator', });
	//const operatorsTrack = operatorsTrackGroup.addTrack(new SfmTrack({ name: 'Operators', trackType: 'operator', }));
	operatorsTrackGroup.do(new Command(operatorsTrackGroup, 'add-Track', operatorsTrack));
	const operatorClip = new SfmOperatorClip({ name: 'Operators' });//operatorsTrack.addClip(new SfmOperatorClip({ name: 'Operators' })) as SfmOperatorClip;
	operatorsTrack.do(new Command(operatorsTrack, 'add-clip', operatorClip));
	operatorClip.addOperator(new SfmModuloOperator({ name: 'Modulo' }));

	//this.#session.addClip(clip);
	const filmTrackGroup = new SfmTrackGroup({ name: 'Film' });
	const filmTrack = new SfmTrack({ name: 'Film 1', trackType: 'film' });
	film.do(new Command(film, 'add-track-group', filmTrackGroup));//film.addTrackGroup(filmTrackGroup/*new SfmTrackGroup({ name: 'Film' })).addTrack(new SfmTrack({ name: 'Film 1', trackType: 'film' })* /)//.addClip(clip);
	filmTrackGroup
	filmTrackGroup.do(new Command(filmTrackGroup, 'add-track', filmTrack));
	filmTrack.do(new Command(filmTrack, 'add-clip', clip));

	const result = SfmSerializer.serializeJSON(session);
	console.info('save', result);

	load(result);
	*/

}
