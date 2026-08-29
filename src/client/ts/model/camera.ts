import { Camera, CameraFrustum, Text2D } from 'harmony-3d';
import { Serializable, SerializableParameters, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';

/*
export interface CameraParameters extends SerializableParameters {
	camera?: Camera;
}
*/

export class SfmCamera extends Serializable {
	readonly isSfmCamera = true as const;
	readonly #camera = new Camera();
	readonly #cameraText = new Text2D({ parent: this.#camera });
	readonly #cameraFrustum = new CameraFrustum({ parent: this.#camera });

	constructor(params: SerializableParameters = {}) {
		super(params);
		this.#setName(this.getName());
	}

	setName(name: string): void {
		super.setName(name);
		this.#setName(name);
	}

	#setName(name: string): void {
		this.#camera.name = name;
		this.#cameraText.setText(name);
	}

	getCamera(): Camera {
		return this.#camera;
	}

	copy(source: SfmCamera): void {
		this.#camera.copy(source.#camera);
	}

	static override getTypeName(): string {
		return 'Camera';
	}
}

SfmSerializer.registerSerializable(SfmCamera);
