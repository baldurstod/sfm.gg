import { CanvasAttributes, CanvasView, Entity, FirstPersonControl, Graphics, GraphicsEvents, OrbitGizmo, Scene, SceneExplorer } from 'harmony-3d';
import { cameraswitchSVG, fastForwardSVG, fastRewindSVG, keyboardDoubleArrowLeftSVG, keyboardDoubleArrowRightSVG, pauseSVG, playSVG, skipNextSVG, skipPreviousSVG, videoCameraBackAddSVG } from 'harmony-svg';
import { createElement } from 'harmony-ui';
import viewportCSS from '../../css/viewport.css';
import { CameraAdded, Controller, SetActiveCamera } from '../controller';
import { workCamera } from '../graphics/graphics';
import { SfmCamera } from '../model/camera';
import { SfmFilmClip } from '../model/clips/filmclip';
import { SfmEntity } from '../model/entity';
import { SfmNode } from '../model/node';
import { Panel } from './panel';

export class ViewportPanel extends Panel {
	#htmlTime?: HTMLElement;
	#htmlCamera?: HTMLElement;
	#htmlCanvas?: HTMLCanvasElement;
	#htmlCameraSelector?: HTMLSelectElement;
	#htmlCameraSwitch?: HTMLButtonElement;
	#htmlPlayPauseButton?: HTMLButtonElement;
	#playing = false;
	#topFilmClip: SfmFilmClip | null = null;
	//#activeCamera: Camera | null = null;
	#camerasOptions = new WeakMap<SfmCamera, HTMLOptionElement>();
	#optionsCameras = new WeakMap<HTMLOptionElement, SfmCamera>();
	#useWorkCamera = true;
	#cameraControl = new FirstPersonControl(workCamera.getEngineEntity());
	#canvasAttributes: CanvasAttributes | null = null;
	#canvasView?: CanvasView;
	#orbitGizmo = new OrbitGizmo();
	static nextId = 0;
	#id = ++ViewportPanel.nextId;
	#titleI18n?: string;
	static #scene = new Scene({ name: 'Viewports scene' });
	#addedChilds = new Map<Entity, Set<Entity>>();

	constructor(titleI18n?: string) {
		super();
		Controller.addEventListener('cameraadded', (event) => this.#cameraAdded(event.detail));
		Controller.addEventListener('cameraremoved', (event) => this.#cameraRemoved(event.detail));
		Controller.addEventListener('settopfilmclip', (event) => this.#setTopFilmClip(event.detail));
		Controller.addEventListener('setactivecamera', (event) => this.#setActiveCamera(event.detail));
		Controller.addEventListener('usersetplaying', (event) => this.#setPlaying(event.detail));
		//Controller.addEventListener('userplay', () => this.#setPlaying(true));
		Controller.addEventListener('setcurrenttime', (event) => this.#setCurrentTime(event.detail));
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		Controller.addEventListener('setactivefilmclips', (event) => this.#setActiveFilmClips(event.detail));

		GraphicsEvents.addEventListener('tick', (event) => this.#cameraControl.update(event.detail.delta));

		this.#cameraControl.movementSpeed = 100;
		this.#cameraControl.lookSpeed = 0.1;
		this.#titleI18n = titleI18n;
		this.#cameraChanged(workCamera);
		//this.#orbitGizmo.orbitControl = this.#cameraControl;
	}

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: viewportCSS, titleI18n: this.#titleI18n ?? '#viewport', layout: 'column' });

		createElement('div', {
			class: 'header',
			parent: this.panel!.getContent(),
			childs: [
				this.#htmlTime = createElement('div'),
				this.#htmlCamera = createElement('div'),
			],
		});

		createElement('div', {
			class: 'canvas-container',
			parent: this.panel!.getContent(),
			childs: [
				this.#htmlCanvas = createElement('canvas') as HTMLCanvasElement,
				//this.#orbitGizmo.getHtmlElement(),
			],
		});

		this.#cameraControl.canvas = this.#htmlCanvas;

		createElement('div', {
			class: 'controls',
			parent: this.panel!.getContent(),
			childs: [
				createElement('span', {
					childs: [
						this.#htmlCameraSelector = createElement('select', {
							class: 'camera-selector',
							$input: () => {
								const option = this.#htmlCameraSelector!.selectedOptions[0];
								if (option) {
									const camera = this.#optionsCameras.get(option);
									if (camera) {
										Controller.dispatchEvent('userselectcamera', { detail: camera });
										this.#useWorkCamera = false;
									}
								}
							},
						}) as HTMLSelectElement,
						createElement('button', {
							innerHTML: videoCameraBackAddSVG,
							$click: () => {
								Controller.dispatchEvent('useraddcamera', { detail: this.#useWorkCamera ? workCamera : this.#topFilmClip?.getActiveCamera() ?? null });
								this.#useWorkCamera = false;
							},
						}),
						this.#htmlCameraSwitch = createElement('button', {
							innerHTML: cameraswitchSVG,
							$click: () => this.#switchCamera(),
							disabled: true,
						}) as HTMLButtonElement,
					],
				}),

				createElement('span', {
					class: 'playback',
					childs: [
						createElement('button', {
							innerHTML: fastRewindSVG,
							$click: () => Controller.dispatchEvent('usergotofirstframe'),
						}),
						createElement('button', {
							innerHTML: keyboardDoubleArrowLeftSVG,
							$click: () => Controller.dispatchEvent('usergotopreviousclip'),
						}),
						createElement('button', {
							innerHTML: skipPreviousSVG,
							$click: () => Controller.dispatchEvent('usergotopreviousframe'),
						}),
						this.#htmlPlayPauseButton = createElement('button', {
							innerHTML: playSVG,
							$click: () => this.#togglePlayPause(),
						}) as HTMLButtonElement,
						createElement('button', {
							innerHTML: skipNextSVG,
							$click: () => Controller.dispatchEvent('usergotonextframe'),
						}),
						createElement('button', {
							innerHTML: keyboardDoubleArrowRightSVG,
							$click: () => Controller.dispatchEvent('usergotonextclip'),
						}),
						createElement('button', {
							innerHTML: fastForwardSVG,
							$click: () => Controller.dispatchEvent('usergotolastframe'),
						}),
					],
				}),

			],
		});

		this.#canvasAttributes = Graphics.addCanvas({
			name: `viewport${this.#id}`,
			scene: ViewportPanel.#scene,
			autoResize: true,
			canvas: this.#htmlCanvas,
		});

		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		if (view) {
			this.#canvasView = view;
			const cameraEntity = workCamera.getEngineEntity();
			view.camera = cameraEntity;
			view.additionalObjects = new Set([cameraEntity]);
		}
	}

	#togglePlayPause(): void {
		// Dispatch an event so all viewports toggle in sync
		Controller.dispatchEvent('usersetplaying', { detail: !this.#playing });
		/*
		if (this.#playing) {
		} else {
			Controller.dispatchEvent('userplay');
		}
		*/
	}

	#setPlaying(playing: boolean): void {
		this.#playing = playing;
		if (this.#playing) {
			this.#htmlPlayPauseButton!.innerHTML = pauseSVG;
		} else {
			this.#htmlPlayPauseButton!.innerHTML = playSVG;
		}
	}

	#setCurrentTime(time: number): void {
		if (!this.#htmlTime) {
			return;
		}

		this.#htmlTime.innerText = formatTime(time);
	}

	async #setActiveFilmClips(clips: Set<SfmFilmClip>): Promise<void> {
		ViewportPanel.#scene.removeChildren();
		this.#removeChilds();

		for (const clip of clips) {
			const current: SfmNode<SfmEntity> | undefined = clip.getSceneWithWorld();
			if (!current) {
				continue;
			}

			const scene = await current.getEntity()?.getEngineEntityAsync();
			if (scene) {
				ViewportPanel.#scene.addChild(scene);
				new SceneExplorer().setScene(scene as Scene);
			}

			const stack: SfmNode[] = [current];
			// TODO: improve this: this run every frame
			for (; ;) {
				const current = stack.pop();
				if (!current) {
					break;
				}

				stack.push(...current.getChildren());

				const currentEntity = await current.getEntity()?.getEngineEntityAsync();
				if (!currentEntity) {
					continue;
				}
				const parentEntity = await current.getParent()?.getEntity()?.getEngineEntityAsync();
				if (!parentEntity) {
					continue;
				}
				parentEntity.addChild(currentEntity);
				this.#setParentEntity(parentEntity, currentEntity);
			}
		}
		//clips.forEach(clip => ViewportPanel.#scene.addChild(clip.scene?.getEntity()?.getEngineEntity()));
	}

	#setParentEntity(parent: Entity, child: Entity): void {
		let existing = this.#addedChilds.get(parent);
		if (!existing) {
			existing = new Set<Entity>();
			this.#addedChilds.set(parent, existing);
		}

		existing.add(child);
	}

	#removeChilds(): void {
		for (const [, s] of this.#addedChilds) {
			for (const e of s) {
				e.remove();
			}
		}

		this.#addedChilds.clear();
	}

	#getNodeEntity(node: SfmNode): Entity | undefined | null {
		return node.getEntity()?.getEngineEntity();
	}

	#setTopFilmClip(clip: SfmFilmClip): void {
		this.#topFilmClip = clip;
	}

	#setActiveCamera(detail: SetActiveCamera): void {
		if (detail.clip !== this.#topFilmClip) {
			return;
		}

		const activeCamera = detail.camera;
		if (activeCamera) {
			const option = this.#camerasOptions.get(activeCamera);
			if (!option) {
				return;
			}
			option.selected = true;
		}

		//this.#useWorkCamera = false;
		this.#setCanvasCamera(activeCamera);
		this.#cameraChanged(activeCamera ?? workCamera);
	}

	#cameraAdded(detail: CameraAdded): void {
		if (detail.clip === this.#topFilmClip) {
			this.#refreshCameras();
		}
	}

	#cameraRemoved(detail: CameraAdded): void {
		if (detail.clip === this.#topFilmClip) {
			this.#refreshCameras();

			const realCamera = detail.camera?.getEngineEntity();
			if (realCamera) {
				this.#canvasView?.additionalObjects?.delete(realCamera);
			}
		}
	}

	#refreshCameras(): void {
		this.initPanel();
		this.#htmlCameraSelector?.replaceChildren();

		if (!this.#topFilmClip) {
			return;
		}

		this.#htmlCameraSwitch?.setAttribute('disabled', '');

		for (const camera of this.#topFilmClip.getCameras()) {
			this.#htmlCameraSwitch?.removeAttribute('disabled');
			const option = createElement('option', {
				value: camera.getName(),
				innerText: camera.getName(),
				parent: this.#htmlCameraSelector,
			}) as HTMLOptionElement;

			this.#camerasOptions.set(camera, option);
			this.#optionsCameras.set(option, camera);
		}
	}

	#switchCamera(): void {
		this.#useWorkCamera = !this.#useWorkCamera;

		this.#setCanvasCamera(/*this.#cameraControl.camera*/);
	}

	#setCanvasCamera(camera?: SfmCamera): void {
		//let camera: Camera;
		if (camera) {
			this.#useWorkCamera = false;
		} else {
			if (this.#useWorkCamera) {
				camera = workCamera;//.getEngineEntity()!;
			} else {
				camera = this.#topFilmClip?.getActiveCamera();//?.getEngineEntity() ?? workCamera.getEngineEntity();
			}
		}

		if (!camera) {
			camera = workCamera;
			this.#useWorkCamera = true;
		}

		const realCamera = camera?.getEngineEntity();
		if (realCamera) {

			this.#cameraControl.camera = realCamera;

			const view = this.#canvasView;
			if (view) {
				view.camera = realCamera;
				view.additionalObjects?.add(realCamera);
			}

			this.#cameraChanged(camera);
		}
	}

	#cameraChanged(camera: SfmCamera): void {
		this.initPanel();
		this.#htmlCamera!.innerText = camera.getName();
	}
}

function formatTime(time: number): string {
	const sign = Math.sign(time);
	time = Math.abs(time);
	const hours = Math.floor(time / 3600);
	const minutes = Math.floor((time % 3600) / 60);
	const seconds = Math.floor(time % 60);
	//const milli = Math.floor((time - Math.floor(time )) * 1000);
	const milli = Math.floor((time % 1) * 1000);


	return `${sign < 0 ? '-' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milli).padStart(3, '0')}`;


}
