import { Camera, CanvasAttributes, FirstPersonControl, Graphics, GraphicsEvents, GraphicTickEvent, OrbitGizmo, SceneExplorer } from 'harmony-3d';
import { cameraswitchSVG, fastForwardSVG, fastRewindSVG, keyboardDoubleArrowLeftSVG, keyboardDoubleArrowRightSVG, pauseSVG, playSVG, skipNextSVG, skipPreviousSVG, videoCameraBackAddSVG } from 'harmony-svg';
import { createElement } from 'harmony-ui';
import viewportCSS from '../../css/viewport.css';
import { CameraAdded, Controller, SetActiveCamera } from '../controller';
import { workCamera } from '../graphics/graphics';
import { SfmCamera } from '../model/camera';
import { SfmFilmClip } from '../model/clips/filmclip';
import { Panel } from './panel';

export class ViewportPanel extends Panel {
	#htmTime?: HTMLElement;
	#htmlCanvas?: HTMLCanvasElement;
	#htmlCameraSelector?: HTMLSelectElement;
	#htmlPlayPauseButton?: HTMLButtonElement;
	#playing = false;
	#topFilmClip: SfmFilmClip | null = null;
	//#activeCamera: Camera | null = null;
	#camerasOptions = new WeakMap<SfmCamera, HTMLOptionElement>();
	#optionsCameras = new WeakMap<HTMLOptionElement, SfmCamera>();
	#useWorkCamera = true;
	#cameraControl = new FirstPersonControl(workCamera.getCamera()!);
	#canvasAttributes: CanvasAttributes | null = null;
	#orbitGizmo = new OrbitGizmo();
	static nextId = 0;
	#id = ++ViewportPanel.nextId;
	#titleI18n?: string;

	constructor(titleI18n?: string) {
		super();
		Controller.addEventListener('cameraadded', (event) => this.#cameraAdded(event.detail));
		Controller.addEventListener('settopfilmclip', (event) => this.#setTopFilmClip(event.detail));
		Controller.addEventListener('setactivecamera', (event) => this.#setActiveCamera(event.detail));
		Controller.addEventListener('usersetplaying', (event) => this.#setPlaying(event.detail));
		//Controller.addEventListener('userplay', () => this.#setPlaying(true));
		Controller.addEventListener('setcurrenttime', (event) => this.#setCurrentTime(event.detail));

		GraphicsEvents.addEventListener('tick', (event) => this.#cameraControl.update((event as CustomEvent<GraphicTickEvent>).detail.delta));

		this.#cameraControl.movementSpeed = 100;
		this.#cameraControl.lookSpeed = 0.1;
		this.#titleI18n = titleI18n;
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
				this.#htmTime = createElement('div'),
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
								Controller.dispatchEvent('useraddcamera', { detail: this.#useWorkCamera ? workCamera : this.#topFilmClip?.activeCamera ?? null });
								this.#useWorkCamera = false;
							},
						}),
						createElement('button', {
							innerHTML: cameraswitchSVG,
							$click: () => this.#switchCamera(),
						}),
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

		//const scene = new Scene();
		//scene.addChild(new Box({ /*segments: 16, rings: 16*/ }));

		this.#canvasAttributes = Graphics.addCanvas({
			name: `viewport${this.#id}`,
			//scene,
			autoResize: true,
			canvas: this.#htmlCanvas,
		});

		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		if (view) {
			view.camera = workCamera.getCamera();
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
		if (!this.#htmTime) {
			return;
		}

		this.#htmTime.innerText = formatTime(time);
	}

	#setTopFilmClip(clip: SfmFilmClip): void {
		this.#topFilmClip = clip;

		const scene = clip.scene?.getScene();
		if (scene) {
			new SceneExplorer().setScene(scene);
		}

		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		if (view) {
			view.scene = clip.scene?.getScene();
		}

		this.#refreshCameras();
	}

	#setActiveCamera(detail: SetActiveCamera): void {
		if (detail.clip !== this.#topFilmClip) {
			return;
		}

		const option = this.#camerasOptions.get(detail.camera);
		if (!option) {
			return;
		}

		option.selected = true;

		//this.#useWorkCamera = false;
		this.#setCanvasCamera(detail.camera.getCamera());
	}

	#cameraAdded(detail: CameraAdded): void {
		if (detail.clip === this.#topFilmClip) {
			this.#refreshCameras();
		}
	}

	#refreshCameras(): void {
		this.initPanel();
		this.#htmlCameraSelector?.replaceChildren();

		if (!this.#topFilmClip) {
			return;
		}

		for (const camera of this.#topFilmClip.getCameras()) {
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

	#setCanvasCamera(camera?: Camera): void {
		//let camera: Camera;
		if (camera) {
			this.#useWorkCamera = false;
		} else {
			if (this.#useWorkCamera) {
				camera = workCamera.getCamera()!;
			} else {
				camera = this.#topFilmClip?.activeCamera?.getCamera() ?? workCamera.getCamera()!;
			}
		}

		this.#cameraControl.camera = camera;

		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		if (view) {
			view.camera = camera;
		}
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
