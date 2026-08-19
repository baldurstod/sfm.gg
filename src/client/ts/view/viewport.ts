import { Camera, CanvasAttributes, FirstPersonControl, Graphics, GraphicsEvent, GraphicsEvents, GraphicTickEvent, OrbitGizmo, SceneExplorer } from 'harmony-3d';
import { cameraswitchSVG, videoCameraBackAddSVG } from 'harmony-svg';
import { createElement } from 'harmony-ui';
import viewportCSS from '../../css/viewport.css';
import { CameraAdded, Controller, SetActiveCamera } from '../controller';
import { workCamera } from '../graphics/graphics';
import { Clip } from '../session/clip';
import { Panel } from './panel';

export class ViewportPanel extends Panel {
	#htmlCanvas?: HTMLCanvasElement;
	#htmlCameraSelector?: HTMLSelectElement;
	#activeClip: Clip | null = null;
	//#activeCamera: Camera | null = null;
	#camerasOptions = new WeakMap<Camera, HTMLOptionElement>();
	#useWorkCamera = true;
	#cameraControl = new FirstPersonControl(workCamera);
	#canvasAttributes: CanvasAttributes | null = null;
	#orbitGizmo = new OrbitGizmo();

	constructor() {
		super();
		Controller.addEventListener('cameraadded', (event) => this.#cameraAdded(event.detail));
		Controller.addEventListener('setactiveclip', (event) => this.#setActiveClip(event.detail));
		Controller.addEventListener('setactivecamera', (event) => this.#setActiveCamera(event.detail));

		GraphicsEvents.addEventListener(GraphicsEvent.Tick, (event) => this.#cameraControl.update((event as CustomEvent<GraphicTickEvent>).detail.delta));

		this.#cameraControl.movementSpeed = 100;
		this.#cameraControl.lookSpeed = 0.1;
		//this.#orbitGizmo.orbitControl = this.#cameraControl;
	}

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: viewportCSS, titleI18n: '#viewport', layout: 'column' });
		createElement('div', {
			class: 'canvas-container',
			parent: this.panel!.getContent(),
			childs: [
				this.#htmlCanvas = createElement('canvas', { parent: this.panel!.getContent() }) as HTMLCanvasElement,
				//this.#orbitGizmo.getHtmlElement(),
			],
		}) as HTMLCanvasElement;

		createElement('div', {
			parent: this.panel!.getContent(),
			childs: [
				this.#htmlCameraSelector = createElement('select', {
					class: 'camera-selector',
				}) as HTMLSelectElement,
				createElement('button', {
					innerHTML: videoCameraBackAddSVG,
					$click: () => Controller.dispatchEvent('addcamera', { detail: this.#useWorkCamera ? workCamera : this.#activeClip?.activeCamera ?? null }),
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
			name: 'TODO',
			//scene,
			autoResize: true,
			canvas: this.#htmlCanvas,
		});

		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		if (view) {
			view.camera = workCamera;
		}
	}

	/*
	#setSession(): void {
		this.#setActiveClip(null)
	}
	*/

	#setActiveClip(clip: Clip): void {
		this.#activeClip = clip;

		new SceneExplorer().scene = clip.scene;


		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		if (view) {
			view.scene = clip.scene;
		}

		this.#refreshCameras();
	}

	#setActiveCamera(detail: SetActiveCamera): void {
		if (detail.clip !== this.#activeClip) {
			return;
		}

		const option = this.#camerasOptions.get(detail.camera);
		if (!option) {
			return;
		}

		option.selected = true;

		this.#useWorkCamera = false;
		this.#setCanvasCamera(detail.camera);
	}

	#cameraAdded(detail: CameraAdded): void {
		if (detail.clip === this.#activeClip) {
			this.#refreshCameras();
		}
	}

	#refreshCameras(): void {
		this.initPanel();
		this.#htmlCameraSelector?.replaceChildren();

		if (!this.#activeClip) {
			return;
		}

		for (const camera of this.#activeClip.getCameras()) {
			const option = createElement('option', {
				value: camera.name,
				innerText: camera.name,
				parent: this.#htmlCameraSelector,
			}) as HTMLOptionElement;

			this.#camerasOptions.set(camera, option);
		}
	}

	#switchCamera(): void {
		this.#useWorkCamera = !this.#useWorkCamera;

		this.#setCanvasCamera(/*this.#cameraControl.camera*/);
	}

	#setCanvasCamera(camera?: Camera): void {
		//let camera: Camera;
		if (!camera) {
			if (this.#useWorkCamera) {
				camera = workCamera;
			} else {
				camera = this.#activeClip?.activeCamera ?? workCamera;
			}
		}

		this.#cameraControl.camera = camera;

		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		if (view) {
			view.camera = camera;
		}
	}
}
