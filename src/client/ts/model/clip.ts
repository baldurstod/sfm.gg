import { Camera, Scene } from 'harmony-3d';
import { Serializable } from '../serialize/serializable';
import { JSONSerializable, SFMSerializer } from '../serialize/serializer';
import { SfmCamera } from './camera';

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

export class SfmClip extends Serializable {
	readonly isClip = true as const;
	scene = new Scene();
	#cameras = new Set<SfmCamera>();
	activeCamera?: SfmCamera;
	#visible = true;
	#mute = false;
	start = 0;
	end = 0;
	volume = 1;
	mute = false;

	setScene(scene: Scene): void {
		this.scene = scene;
	}

	addCamera(camera: SfmCamera): void {
		this.#cameras.add(camera);

		this.scene.addChild(camera.getCamera());
	}

	setActiveCamera(camera: SfmCamera): void {
		this.activeCamera = camera;
	}

	getCameras(): Set<SfmCamera> {
		return new Set(this.#cameras);
	}

	hasCamera(camera: SfmCamera): boolean {
		return this.#cameras.has(camera);
	}

	static override getTypeName(): string {
		return 'Clip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.activeCamera) {
			json.active_camera = this.activeCamera;
		}

		if (this.#cameras.size) {
			json.cameras = [...this.#cameras];
		}

		return json;
	}

	override unserialize(json: JSONSerializable, elements: Map<string, Serializable>): void {
		super.unserialize(json, elements);


		this.activeCamera = undefined;
		this.#cameras.clear();

		if (json.active_camera) {
			this.activeCamera = elements.get(json.active_camera as string) as SfmCamera | undefined; // TODO: check if it's actually a camera
		}

		if (json.cameras) {
			for (const cameraId of json.cameras as string[]) {
				const camera = elements.get(cameraId) as SfmCamera | undefined; // TODO: check if it's actually a camera

				if (camera) {
					this.#cameras.add(camera);
				}
			}
		}
	}
}

SFMSerializer.registerSerializable(SfmClip);
