import { Serializable, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmCamera } from './camera';
import { SfmClip } from './clip';
import { SfmScene } from './scene';

export class SfmFilmClip extends SfmClip {
	readonly isSfmFilmClip = true as const;
	scene = new SfmScene();
	#cameras = new Set<SfmCamera>();
	activeCamera?: SfmCamera;

	setScene(scene: SfmScene): void {
		this.scene = scene;
	}

	addCamera(camera: SfmCamera): void {
		this.#cameras.add(camera);

		this.scene.getScene().addChild(camera.getCamera());
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
		return 'FilmClip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.scene = this.scene;

		if (this.activeCamera) {
			json.active_camera = this.activeCamera;
		}

		if (this.#cameras.size) {
			json.cameras = [...this.#cameras];
		}

		return json;
	}

	unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		const elements = context.elements;

		this.activeCamera = undefined;
		this.#cameras.clear();

		if (json.scene) {
			const scene = elements.get(json.scene as string) as SfmScene | undefined; // TODO: check if it's actually a scene
			if (scene) {
				this.scene = scene;
			}
		}

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

SfmSerializer.registerSerializable(SfmFilmClip);
