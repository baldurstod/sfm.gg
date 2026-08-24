import { Camera, CameraFrustum, Text2D } from 'harmony-3d';
import { Serializable, SerializableParameters } from '../serialize/serializable';
import { JSONSerializable, SFMSerializer } from '../serialize/serializer';

/*
export interface CameraParameters extends SerializableParameters {
	camera?: Camera;
}
*/

export class SfmCamera extends Serializable {
	readonly isSFMCamera = true as const;
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

	getCamera(): Camera | undefined {
		return this.#camera;
	}

	copy(source: SfmCamera): void {
		this.#camera.copy(source.#camera);
	}

	static override getTypeName(): string {
		return 'Camera';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();
		return json;
	}

	override unserialize(json: JSONSerializable, elements: Map<string, Serializable>): void {
		super.unserialize(json, elements);
	}
}

SFMSerializer.registerSerializable(SfmCamera);
