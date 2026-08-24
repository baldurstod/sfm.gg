import { Box, Camera, Scene } from 'harmony-3d';
import { workCamera } from '../graphics/graphics';
import { Serializable, SerializableParameters } from '../serialize/serializable';
import { SFMSerializer } from '../serialize/serializer';

/*
export type LightParameters = EntityParameters & {
	color?: vec3,
	intensity?: number,
	radius?: number,
};
*/

/*
export interface ClipParameters extends SerializableParameters {
}
*/

export class Clip extends Serializable {
	scene = new Scene();
	#cameras = new Set<Camera>();
	activeCamera: Camera | null = null;
	#visible = true;
	#mute = false;
	start = 0;
	end = 0;
	volume = 1;
	mute = false;

	constructor(params: SerializableParameters = {}) {
		super(params);
		//this.name = name;
		this.scene.addChild(new Box({ /*segments: 16, rings: 16*/ }));
		this.scene.addChild(workCamera);
		return this
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

	static override getTypeName(): string {
		return 'Clip';
	}
}

SFMSerializer.registerSerializable(Clip);
