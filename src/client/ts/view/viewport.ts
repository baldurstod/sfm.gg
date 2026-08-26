import { Camera, CanvasAttributes, FirstPersonControl, Graphics, GraphicsEvent, GraphicsEvents, GraphicTickEvent, OrbitGizmo, SceneExplorer } from 'harmony-3d';
import { cameraswitchSVG, videoCameraBackAddSVG } from 'harmony-svg';
import { createElement } from 'harmony-ui';
import viewportCSS from '../../css/viewport.css';
import { CameraAdded, Controller, SetActiveCamera } from '../controller';
import { workCamera } from '../graphics/graphics';
import { SfmCamera } from '../model/camera';
import { SfmClip } from '../model/clip';
import { SfmFilmClip } from '../model/filmclip';
import { Panel } from './panel';

export class ViewportPanel extends Panel {
	#htmlCanvas?: HTMLCanvasElement;
	#htmlCameraSelector?: HTMLSelectElement;
	#activeFilmClip: SfmFilmClip | null = null;
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
		Controller.addEventListener('setactivefilmclip', (event) => this.#setActiveFilmClip(event.detail));
		Controller.addEventListener('setactivecamera', (event) => this.#setActiveCamera(event.detail));

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
			class: 'canvas-container',
			parent: this.panel!.getContent(),
			childs: [
				this.#htmlCanvas = createElement('canvas', { parent: this.panel!.getContent() }) as HTMLCanvasElement,
				//this.#orbitGizmo.getHtmlElement(),
			],
		}) as HTMLCanvasElement;

		this.#cameraControl.canvas = this.#htmlCanvas;

		createElement('div', {
			parent: this.panel!.getContent(),
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
						Controller.dispatchEvent('useraddcamera', { detail: this.#useWorkCamera ? workCamera : this.#activeFilmClip?.activeCamera ?? null });
						this.#useWorkCamera = false;
					},
				}) as HTMLButtonElement,
				createElement('button', {
					innerHTML: cameraswitchSVG,
					$click: () => this.#switchCamera(),
				}) as HTMLButtonElement,
			],
		}) as HTMLSelectElement;

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

	#setActiveFilmClip(clip: SfmFilmClip): void {
		this.#activeFilmClip = clip;

		new SceneExplorer().scene = clip.scene.getScene();


		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		if (view) {
			view.scene = clip.scene.getScene();
		}

		this.#refreshCameras();
	}

	#setActiveCamera(detail: SetActiveCamera): void {
		if (detail.clip !== this.#activeFilmClip) {
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
		if (detail.clip === this.#activeFilmClip) {
			this.#refreshCameras();
		}
	}

	#refreshCameras(): void {
		this.initPanel();
		this.#htmlCameraSelector?.replaceChildren();

		if (!this.#activeFilmClip) {
			return;
		}

		for (const camera of this.#activeFilmClip.getCameras()) {
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
				camera = this.#activeFilmClip?.activeCamera?.getCamera() ?? workCamera.getCamera()!;
			}
		}

		this.#cameraControl.camera = camera;

		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		if (view) {
			view.camera = camera;
		}
	}
}
