import { Box, Camera, Scene } from 'harmony-3d';
import { workCamera } from '../graphics/graphics';

export class Clip {
	name: string;
	scene = new Scene();
	#cameras = new Set<Camera>();
	activeCamera: Camera | null = null;
	#visible = true;
	#mute = false;

	constructor(name: string) {
		this.name = name;
		this.scene.addChild(new Box({ /*segments: 16, rings: 16*/ }));
		this.scene.addChild(workCamera);
	}

	setScene(scene: Scene): void {
		this.scene = scene;
	}

	addCamera(camera: Camera): void {
		this.#cameras.add(camera);

		this.scene.addChild(camera);
	}

	setActiveCamera(camera: Camera): void {
		this.activeCamera = camera;
	}

	getCameras(): Set<Camera> {
		return new Set(this.#cameras);
	}

	hasCamera(camera: Camera): boolean {
		return this.#cameras.has(camera);
	}
}
