import { ContextType, Graphics, GraphicsEvents, GraphicTickEvent, Repositories, Source1MaterialManager, Source1ModelManager, Source1ParticleControler, Source2ModelManager, WebGLStats, WebRepository } from 'harmony-3d';
import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents, ShortcutHandler } from 'harmony-browser-utils';
import { JSONObject } from 'harmony-types';
import { documentStyle, I18n, I18nTranslation } from 'harmony-ui';
import { errorOnce } from 'harmony-utils';
import htmlCSS from '../css/html.css';
import varsCSS from '../css/vars.css';
import english from '../json/i18n/english.json';
import french from '../json/i18n/french.json';
import optionsmanager from '../json/optionsmanager.json';
import { ALYX_REPOSITORY, CSGO_REPOSITORY, DEADLOCK_REPOSITORY, DOTA2_REPOSITORY, TF2_REPOSITORY } from './constants';
import { AddCharacter, AddClip, AddTrack, Controller, DeleteCharacter, DeleteOperator, EditCharacter, SelectCharacter, SetName, SetSelectedClip, UpdateCharacter } from './controller';
import { workCamera } from './graphics/graphics';
import { Action } from './history/action';
import { History } from './history/history';
import { GameList, getCharacter, getItem, getItemIdStyle, getTf2Characters } from './misc/character';
import { SfmCamera } from './model/camera';
import { SfmChannel } from './model/channels/channel';
import { SfmClip, SfmClipType } from './model/clips/clip';
import { SfmFilmClip } from './model/clips/filmclip';
import { SfmOperatorClip } from './model/clips/operatorclip';
import { SfmSoundClip } from './model/clips/soundclip';
import { SfmAmbientLight } from './model/lights/ambientlight';
import { SfmLight, SfmLightType } from './model/lights/light';
import { SfmPointLight } from './model/lights/pointlight';
import { SfmModel } from './model/model';
import { SfmNode } from './model/node';
import { SfmModuloOperator } from './model/operators/math/modulo';
import { SfmTimeOperator } from './model/operators/time';
import { SfmPrimitiveBox } from './model/primitives/box';
import { SfmScene } from './model/scene';
import { SfmSession } from './model/session';
import { SfmTimeFrame } from './model/timeframe';
import { SfmTrack } from './model/track';
import { SfmTrackGroup } from './model/trackgroup';
import { Player } from './player';
import { JSONFile, SfmSerializer } from './serialize/serializer';
import { getItemNodes } from './utils/items';
import { isCharacter, isItem } from './utils/models';
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
		this.#initGraphics();
		this.createNewSession();

		//load();
		save(this.#session);

		this.#updateCurrentTime();
	}

	static async #initGraphics(): Promise<void> {
		let contextType = ContextType.WebGL;
		const url = new URL(document.URL);
		if (url.hash.substring(1) == 'webgpu') {
			contextType = ContextType.WebGPU;
		}

		await Graphics.initCanvas({
			useOffscreenCanvas: true,
			autoResize: false,
			type: contextType,
			webGL: {
				alpha: true,
				preserveDrawingBuffer: true,
				premultipliedAlpha: false,
			}
		});

		const handleTick = (event: Event) => {
			WebGLStats.tick();
			Graphics.renderMultiCanvas((event as CustomEvent<GraphicTickEvent>).detail.delta, {
				time: this.#player.getCurrentTime(),
				timePerCanvas: {
					// The character selector panel should have a regular time
					CharacterSelectorPanel: null,
				}
			});
		}

		GraphicsEvents.addEventListener('tick', handleTick);
		Graphics.play();
	}

	static #initListeners() {
		Controller.addEventListener('useraddcamera', (event) => this.#addCamera(event.detail));
		Controller.addEventListener('usersavesession', () => save(this.#session));
		Controller.addEventListener('userselectcamera', (event) => {
			const clip = this.#session.getFilmClip();
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
		Controller.addEventListener('userselectcharacter', (event) => this.#userSelectCharacter(event.detail));
		Controller.addEventListener('userselectcharacterselectapp', (event) => this.#userSelectCharacterSelectApp(event.detail));
		Controller.addEventListener('useraddcharacter', (event) => this.#userAddCharacter(event.detail));
		Controller.addEventListener('userupdatecharacter', (event) => this.#userUpdateCharacter(event.detail));
		Controller.addEventListener('usergotopreviousframe', () => this.#userPreviousFrame());
		Controller.addEventListener('usergotonextframe', () => this.#userNextFrame());
		Controller.addEventListener('usergotopreviousclip', () => this.#userPreviousClip());
		Controller.addEventListener('usergotonextclip', () => this.#userNextClip());
		Controller.addEventListener('usergotofirstframe', () => this.#userFirstFrame());
		Controller.addEventListener('usergotolastframe', () => this.#userLastFrame());
		Controller.addEventListener('usersetcurrenttime', (event) => this.#userSetTime(event.detail));
		Controller.addEventListener('usersetplaying', (event) => this.#setPlaying(event.detail));
		Controller.addEventListener('userundolastaction', () => this.#undo());
		Controller.addEventListener('userredolastaction', () => this.#redo());
		Controller.addEventListener('useraddselectedclip', (event) => this.#addSelectedClip(event.detail.topClip, event.detail.selected));
		Controller.addEventListener('useraddprimaryselectedclip', (event) => this.#addPrimarySelectedClip(event.detail.topClip, event.detail.selected));
		Controller.addEventListener('usersetselectedclip', (event) => this.#setSelectedClip(event.detail));
		Controller.addEventListener('playersetcurrenttime', () => this.#updateCurrentTime());
		Controller.addEventListener('userbladeclip', (event) => this.#bladeClip(event.detail));
		Controller.addEventListener('userdeleteselectedclips', (event) => this.#deleteSelectedClips(event.detail));
		Controller.addEventListener('userdeleteclip', (event) => this.#deleteClip(event.detail));
		Controller.addEventListener('useraddcliptotrack', (event) => this.#addClipToTrack(event.detail));
		Controller.addEventListener('useraddtracktotrackgroup', (event) => this.#addTrackToTrackGroup(event.detail));
		Controller.addEventListener('userfillgaps', (event) => this.#fillGaps(event.detail));
		Controller.addEventListener('useraddtrackgroup', (event) => this.#addTrackGroup(event.detail));
		Controller.addEventListener('usersetname', (event) => this.#setName(event.detail));
		Controller.addEventListener('userdeletetrack', (event) => this.#deleteTrack(event.detail));
		Controller.addEventListener('userdeletetrackgroup', (event) => this.#deleteTrackGroup(event.detail));
		Controller.addEventListener('userdeleteoperator', (event) => this.#deleteOperator(event.detail));
		Controller.addEventListener('userdeletecharacter', (event) => this.#deleteCharacter(event.detail));
		Controller.addEventListener('usereditcharacter', (event) => this.#editCharacter(event.detail));
		Controller.addEventListener('updateactiveclips', () => this.#setActiveFilmClips());
		Controller.addEventListener('useraddlight', (event) => {
			const detail = event.detail;
			const scene = detail.clip.getScene();
			if (scene) {
				this.#addLight(detail.type, scene);
			}
		});

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
		const clip = this.#session.getFilmClip();
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
		const action = new Action();
		this.#session = new SfmSession({ name: 'session' });

		const film = new SfmFilmClip({ name: 'Film' });
		action.do(this.#session, 'set-film-clip', film);

		const sceneNode = new SfmNode<SfmScene>({ entity: new SfmScene() });
		const clip = new SfmFilmClip({ name: 'shot1', scene: sceneNode, timeFrame: { start: 0, end: 15 }, });
		const clip2 = new SfmFilmClip({ name: 'shot2', scene: new SfmNode<SfmScene>({ entity: new SfmScene() }), timeFrame: { start: 25, end: 35 }, });

		const box = new SfmPrimitiveBox();
		const node = new SfmNode({ entity: box });
		const clipScene = clip.getScene()!;
		action.do(clipScene, 'add-child', node);//clip.scene!.addChild(node)//!.#entity = new SfmPrimitiveBox();
		//action.do(node, 'set-entity', new SfmPrimitiveBox());
		const cameraNode = new SfmNode({ entity: workCamera });
		action.do(clipScene, 'add-child', cameraNode);//clip.scene!.getScene().addChild(workCamera.getCamera());

		const filmTrackGroup = new SfmTrackGroup({ name: 'Film', order: film.getNextTrackGroupOrder(), });
		action.do(film, 'add-track-group', filmTrackGroup);
		const filmTrack = new SfmTrack({ name: 'Film 1', trackType: 'film', order: filmTrackGroup.getNextTrackOrder(), });
		action.do(filmTrackGroup, 'add-track', filmTrack);
		action.do(filmTrack, 'add-clip', clip);
		action.do(filmTrack, 'add-clip', clip2);

		const soundTrackGroup = new SfmTrackGroup({ name: 'Sounds', order: film.getNextTrackGroupOrder(), });
		action.do(film, 'add-track-group', soundTrackGroup);
		const dialog = new SfmTrack({ name: 'Dialog', trackType: 'sound', order: soundTrackGroup.getNextTrackOrder(), });
		action.do(soundTrackGroup, 'add-track', dialog);
		const music = new SfmTrack({ name: 'Music', trackType: 'sound', order: soundTrackGroup.getNextTrackOrder(), });
		action.do(soundTrackGroup, 'add-track', music);

		action.do(dialog, 'add-clip', new SfmSoundClip({ timeFrame: { start: 10, end: 1 } }));
		action.do(dialog, 'add-clip', new SfmSoundClip({ timeFrame: { end: 0.5 } }));
		action.do(dialog, 'add-clip', new SfmSoundClip({ name: 'music1' }));

		const operatorTrackGroup = new SfmTrackGroup({ name: 'Operators', order: film.getNextTrackGroupOrder(), });
		action.do(film, 'add-track-group', operatorTrackGroup);
		const operators = new SfmTrack({ name: 'Operators', trackType: 'operator', order: operatorTrackGroup.getNextTrackOrder(), });
		action.do(operatorTrackGroup, 'add-track', operators);
		const operatorClip = new SfmOperatorClip();
		action.do(operators, 'add-clip', operatorClip);

		const time = new SfmTimeOperator();
		const modulo = new SfmModuloOperator({ predecessors: { input: { output: 'time', element: time } } });
		const channel = new SfmChannel({
			predecessors: {
				input: {
					output: 'output',
					element: modulo,
				}
			},
			toElement: box,
			toAttribute: 'size.x',
		});
		action.do(operatorClip, 'add-operator', channel);
		action.do(operatorClip, 'add-operator', modulo);
		action.do(operatorClip, 'add-operator', time);

		this.#player.setFilmClip(film);



		const characterNode = new SfmNode({
			entity: new SfmModel({
				repository: 'tf2',
				path: 'models/player/sniper',
				metadatas: {
					game: 'tf2',
					type: 'character',
					character: 'sniper',
				},
			}),
		});
		const itemNode = new SfmNode({
			entity: new SfmModel({
				repository: 'tf2',
				path: 'models/workshop/weapons/c_models/c_sydney_sleeper/c_sydney_sleeper',
				metadatas: {
					game: 'tf2',
					item_id: '230',
					item_style: '0',
					type: 'item',
					slot: 'weapon',
				},
			}),
		});

		action.do(sceneNode, 'add-child', characterNode);
		action.do(characterNode, 'add-child', itemNode);

		this.#addLight('ambient', sceneNode, action);

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

	static #userSelectCharacter(detail: SelectCharacter | void): void {
		let primary: SfmClip | undefined;
		let selected: Set<SfmClip>;
		if (detail) {
			primary = detail.primary;
			selected = detail.clips;
		} else {
			const topClip = this.#session.getFilmClip();
			if (!topClip) {
				return;
			}

			primary = topClip.getPrimarySelectedClip();
			selected = topClip.getSelectedClips();
			if (!primary) {
				return;
			}
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

	static async #userAddCharacter(detail: AddCharacter, action?: Action): Promise<void> {
		console.info('userAddCharacter', detail.character)
		const scenes = new Set<SfmNode<SfmScene>>();
		let isInClip = false;
		const currentTime = this.#player.getCurrentTime();
		const addCharacterAction = action ?? History.startAction();

		// Make a scene list. Note that different clips can use the same scene. A set prevents duplicates
		for (const clip of detail.clips) {
			const sceneNode = clip.getScene();
			if (sceneNode) {
				scenes.add(sceneNode);

				// Check if the current time is in one of the selected clip
				if (!isInClip && clip.inTimeFrame(currentTime)) {
					isInClip = true;
				}
			}
		}

		if (!isInClip) {
			// If the play head is not in one of the clip, move it so the character appears
			const newTime = this.#previousOrNextClip(1, detail.clips);
			if (newTime !== undefined) {
				Controller.dispatchEvent('usersetplaying', { detail: false });
				this.#player.setCurrentTime(newTime);
				this.#updateCurrentTime();
			}
		}

		// Add the character to the scenes
		for (const sceneNode of scenes) {
			const children = new Set<SfmNode>();

			const characterNode = new SfmNode({
				entity: new SfmModel({
					repository: detail.character.game,
					path: detail.character.modelPath,
					metadatas: {
						game: detail.character.game,
						type: 'character',
						character: detail.character.name,
					},
				}),
			})
			addCharacterAction.do(sceneNode, 'add-child', characterNode);

			for (const [, item] of detail.character.items) {
				const itemNodes = getItemNodes(item);
				itemNodes.forEach(itemNode => addCharacterAction.do(characterNode, 'add-child', itemNode));
			}
		}
		if (!action) {
			History.commit(addCharacterAction);
		}

		this.#setActiveFilmClips();
		Controller.dispatchEvent('refreshtimeline');
	}

	static async #userUpdateCharacter(detail: UpdateCharacter): Promise<void> {
		console.info(detail);

		const action = History.startAction();
		const characterNode = detail.characterNode;
		const parentNode = characterNode.getParent();
		if (parentNode) {
			action.do(parentNode, 'delete-child', characterNode);
		}

		this.#userAddCharacter({ character: detail.character, clips: detail.clips }, action);

		History.commit(action);

		this.#setActiveFilmClips();
		Controller.dispatchEvent('refreshtimeline');
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

	static #getClipBounds(clips: Set<SfmFilmClip>): Set<number> {
		const frameRate = this.#player.getFrameRate();
		const result = new Set<number>();

		for (const clip of clips) {
			// Note: we round start / end times to match the frame rate, to match the player time
			result.add(Math.round(clip.getStart() * frameRate) / frameRate);
			result.add(Math.round(clip.getEnd() * frameRate) / frameRate);
		}

		// Sort the result by ascending time
		result[Symbol.iterator] = function* (): SetIterator<number> {
			yield* [...this.keys()].sort(
				(a, b) => {
					return a < b ? -1 : 1;
				}
			);
		};

		return result;
	}

	static #userPreviousClip(): void {
		this.#userPreviousOrNextClip(-1);
	}

	static #userNextClip(): void {
		this.#userPreviousOrNextClip(1);
	}

	static #userPreviousOrNextClip(delta: number): void {
		const topClip = this.#session.getFilmClip();
		if (!topClip) {
			return;
		}
		const clips = topClip.getSubClips('film');
		clips.add(topClip);

		const newTime = this.#previousOrNextClip(delta, clips);
		if (newTime === undefined) {
			return;
		}

		Controller.dispatchEvent('usersetplaying', { detail: false });
		this.#player.setCurrentTime(newTime);
		this.#updateCurrentTime();
	}

	static #previousOrNextClip(delta: number, clips: Set<SfmFilmClip>): number | undefined {
		const bounds = this.#getClipBounds(clips);

		const currentTime = this.#player.getCurrentTime();
		bounds.add(currentTime);

		const boundsArray = [...bounds];
		const i = boundsArray.indexOf(currentTime);
		if (i === -1) {
			return;
		}

		return boundsArray[i + delta];
	}

	static #userFirstFrame(): void {
		const topClip = this.#session.getFilmClip();
		if (!topClip) {
			return;
		}

		const frameRate = this.#player.getFrameRate();

		Controller.dispatchEvent('usersetplaying', { detail: false });
		this.#player.setCurrentTime(Math.round(topClip.getStart() * frameRate) / frameRate);
		this.#updateCurrentTime();
	}

	static #userLastFrame(): void {
		const topClip = this.#session.getFilmClip();
		if (!topClip) {
			return;
		}

		const frameRate = this.#player.getFrameRate();

		Controller.dispatchEvent('usersetplaying', { detail: false });
		this.#player.setCurrentTime(Math.round(topClip.getEnd() * frameRate) / frameRate);
		this.#updateCurrentTime();
	}

	static #userSetTime(time: number): void {
		Controller.dispatchEvent('usersetplaying', { detail: false });
		this.#player.setCurrentTime(time);
		this.#updateCurrentTime();
	}

	static #updateCurrentTime(): void {
		const time = this.#player.getCurrentTime();
		Controller.dispatchEvent('setcurrenttime', { detail: time });
		this.#setActiveFilmClips();
		this.#updateClips(time);
	}

	static #setActiveFilmClips(): void {
		const top = this.#session.getFilmClip();
		if (top) {
			const clips = top.getSubClipsAtTime(this.#player.getCurrentTime(), 'film');
			Controller.dispatchEvent('setactivefilmclips', { detail: clips });
		}
	}

	static #updateClips(time: number): void {
		const topClip = this.#session.getFilmClip();
		if (!topClip) {
			return;
		}

		const clips = topClip.getSubClipsAtTime(time);

		for (const clip of clips) {
			clip.update({
				id: 0/*TODO: create a monotonic increment*/,
				time,
			});
		}
	}

	static #bladeClip(topClip: SfmFilmClip): void {
		const action = History.startAction();
		const time = this.#player.getCurrentTime();

		for (const selected of topClip.getSelectedClips()) {// We create a copy as we update the original set
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
			this.#addSelectedClip(topClip, newCLip, action);
		}
		History.commit(action);
		this.#setActiveFilmClips();
	}

	static #deleteSelectedClips(topClip: SfmFilmClip): void {
		const action = History.startAction();

		let deleted = 0;
		for (const selected of topClip.getSelectedClips()) {// We create a copy as we update the original set
			if (!selected.track) {
				continue;
			}

			if (action.do(selected.track, 'delete-clip', selected)) {
				++deleted;
			}
		}

		if (deleted) {
			History.commit(action);
			Controller.dispatchEvent('refreshtimeline');
		}
	}

	static #deleteClip(clip: SfmClip): void {
		if (!clip.track) {
			return;
		}

		const action = History.startAction();
		action.do(clip.track, 'delete-clip', clip);
		History.commit(action);

		Controller.dispatchEvent('refreshtimeline');
	}

	static #addClipToTrack(detail: AddClip): void {
		const track = detail.track;
		const topClip = track.trackGroup?.parentClip;
		if (!topClip) {
			return;
		}
		const action = History.startAction();

		let newCLip: SfmClip;
		switch (track.getTrackType()) {
			case 'film':
				// For a film clip, we first look for a gap corresponding to the click position
				const gaps = track.getGaps();

				let clipTime: SfmTimeFrame;
				for (const gap of gaps) {
					if (gap.inTimeFrame(detail.time)) {
						clipTime = gap;
						break;
					}
				}

				let start = clipTime!?.getStart();
				let end = clipTime!?.getEnd();

				newCLip = new SfmFilmClip({
					scene: new SfmNode<SfmScene>({ entity: new SfmScene(), }),
					timeFrame: {
						...(start !== -Infinity) && { start, },
						...(end !== Infinity) && { end, },
					}
				});
				break;
			case 'sound':
				// TODO: add sound selection
				newCLip = new SfmSoundClip();
				break;
			case 'operator':
				// TODO: something ???
				newCLip = new SfmOperatorClip();
				break;
			default:
				throw new Error('code me ' + track.getTrackType());
		}

		action.do(track, 'add-clip', newCLip);
		//action.do(newCLip, 'set-start', time);//newCLip.setStart(time);
		this.#setSelectedClip({
			topClip,
			selected: newCLip,
		});
		History.commit(action);
		//this.refreshHTML();

		this.#setActiveFilmClips();
	}

	static #fillGaps(track: SfmTrack): void {
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
		//this.refreshHTML();
		Controller.dispatchEvent('refreshtimeline');
	}

	static #setPlaying(playing: boolean): void {
		this.#player.setPlaying(playing);
	}

	static #undo(): void {
		History.undo();
		Controller.dispatchEvent('refreshtimeline');
		this.#setActiveFilmClips();
	}

	static #redo(): void {
		History.redo();
		Controller.dispatchEvent('refreshtimeline');
		this.#setActiveFilmClips();
	}

	/**
	 * Add clip to the selection
	 * @param topClip The film clip to add the selection to
	 * @param selected The clip to add to the selection
	 * @param action An optional undoable action. If provided, the selection command will be added to the action. Otherwise a new independant action will be created
	 */
	static #addSelectedClip(topClip: SfmFilmClip, selected: SfmClip, action?: Action): void {
		const selectionAction = action ?? History.startAction();
		selectionAction.do(topClip, 'add-selected-clip', selected);
		if (!action) {
			History.commit(selectionAction);
		}
		Controller.dispatchEvent('refreshtimeline');
		Controller.dispatchEvent('refreshtoolbar', { detail: { addCharacter: true, } });
	}

	/**
	 * Add clip to the selection, set it primary
	 * @param topClip The film clip to add the selection to
	 * @param selected The clip to add to the selection
	 * @param action An optional undoable action. If provided, the selection command will be added to the action. Otherwise a new independant action will be created
	 */
	static #addPrimarySelectedClip(topClip: SfmFilmClip, selected: SfmClip, action?: Action): void {
		const selectionAction = action ?? History.startAction();
		selectionAction.do(topClip, 'add-primary-selected-clip', selected);
		if (!action) {
			History.commit(selectionAction);
		}
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

	static #addTrackToTrackGroup(params: AddTrack): void {
		const action = History.startAction();
		let name: string;
		switch (params.type as SfmClipType) {
			case 'film':
				name = 'Film track';
				break;
			case 'effect':
				name = 'Effect track';
				break;
			case 'operator':
				name = 'Operator track';
				break;
			case 'sound':
				name = 'Sound track';
				break;
		}
		action.do(params.group, 'add-track', new SfmTrack({ trackType: params.type, name }));
		History.commit(action);

		Controller.dispatchEvent('refreshtimeline');
	}

	static #addTrackGroup(topClip: SfmFilmClip): void {
		const action = History.startAction();
		action.do(topClip, 'add-track-group', new SfmTrackGroup({ order: topClip.getNextTrackGroupOrder(), }));
		History.commit(action);

		Controller.dispatchEvent('refreshtimeline');
	}

	static #setName(detail: SetName): void {
		const action = History.startAction();
		action.do(detail.element, 'set-name', detail.name);
		History.commit(action);

		Controller.dispatchEvent('refreshtimeline');
	}

	static #deleteTrack(track: SfmTrack): void {
		const trackGroup = track.trackGroup;
		if (!trackGroup) {
			return;
		}

		const action = History.startAction();
		action.do(trackGroup, 'delete-track', track);
		History.commit(action);

		Controller.dispatchEvent('refreshtimeline');
	}

	static #deleteTrackGroup(trackGroup: SfmTrackGroup): void {
		const topClip = trackGroup?.parentClip;
		if (!topClip) {
			return;
		}

		const action = History.startAction();
		action.do(topClip, 'delete-track-group', trackGroup);
		History.commit(action);

		Controller.dispatchEvent('refreshtimeline');
	}

	static #deleteOperator(detail: DeleteOperator): void {
		const action = History.startAction();
		action.do(detail.clip, 'delete-operator', detail.operator);
		History.commit(action);

		Controller.dispatchEvent('refreshtimeline');
	}

	static #deleteCharacter(detail: DeleteCharacter): void {
		const parent = detail.characterNode.getParent();
		if (!parent) {
			return;
		}

		const action = History.startAction();
		action.do(parent, 'delete-child', detail.characterNode);
		History.commit(action);

		this.#setActiveFilmClips();
		Controller.dispatchEvent('refreshtimeline');
	}

	static async #editCharacter(detail: EditCharacter): Promise<void> {
		const characterNode = detail.characterNode;
		const characterEntity = characterNode.getEntity();
		if (!characterEntity || !isCharacter(characterNode)) {
			return;
		}

		const itemNodes = new Set<SfmNode<SfmModel>>();
		for (const child of characterNode.getChildren()) {
			if (isItem(child)) {
				itemNodes.add(child as SfmNode<SfmModel>);
			}
		}

		const game = characterEntity.getMetadata('game') as GameList;
		const characterName = characterEntity.getMetadata('character') as string;
		const character = getCharacter(game, characterName);
		if (!character) {
			return;
		}

		for (const itemNode of itemNodes) {
			const itemEntity = itemNode.getEntity();
			if (!itemEntity) {
				continue;
			}

			const item = await getItem(game, characterName, itemEntity.getMetadata('item_id') as string, itemEntity.getMetadata('slot') as string, itemEntity.getMetadata('item_style') as string,);
			if (item) {
				character.items.set(getItemIdStyle(item), item);
			}
		}

		this.#getCharacterSelectorPanel().editCharacter(detail.clip, character, characterNode);
	}

	static #addLight(type: SfmLightType, scene: SfmNode<SfmScene>, action?: Action): void {
		let light: SfmLight
		switch (type) {
			case 'ambient':
				light = new SfmAmbientLight();
				break;
			case 'point':
				light = new SfmPointLight();
				break;
			default:
				errorOnce(`TODO: add light ${type}`);
				return;
		}

		const selectionAction = action ?? History.startAction();
		selectionAction.do(scene, 'add-child', new SfmNode({ entity: light }));
		if (!action) {
			History.commit(selectionAction);
		}

		Controller.dispatchEvent('refreshtimeline');
		this.#setActiveFilmClips();
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
