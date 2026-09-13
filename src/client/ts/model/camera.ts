import { Camera, CameraFrustum, Text2D } from 'harmony-3d';
import { SerializableParameters, SerializablePropertyValue } from '../serialize/serializable';
import { SfmSerializer } from '../serialize/serializer';
import { SfmEntity } from './entity';
import { SfmOperatorOutput } from './operators/io';

/*
export interface CameraParameters extends SerializableParameters {
	camera?: Camera;
}
*/

export class SfmCamera extends SfmEntity {
	readonly isSfmCamera = true as const;
	readonly #camera = new Camera();
	readonly #cameraText = new Text2D({ parent: this.#camera });
	readonly #cameraFrustum = new CameraFrustum({ parent: this.#camera });
	readonly #inputs = new Map<string, SfmOperatorOutput>();

	constructor(params: SerializableParameters = {}) {
		super(params);
		this.#setName(this.getName());
		/*
		this.initDefaultProperties({
			// TODO: set actual values
			'fov': { type: 'number', default: 50 },
			'focal': { type: 'number', default: 0 },
			'aperture': { type: 'number', default: 0 },
			'tone_map_scale': { type: 'number', default: 0 },
			'bloom_scale': { type: 'number', default: 0 },
			'ssao_bias': { type: 'number', default: 0 },
			'ssao_strength': { type: 'number', default: 0 },
			'ssao_radius': { type: 'number', default: 0 },
		});
		*/
	}

	setName(name: string): void {
		super.setName(name);
		this.#setName(name);
	}

	#setName(name: string): void {
		this.#camera.name = name;
		this.#cameraText.setText(name);
	}

	copy(source: SfmCamera): void {
		this.#camera.copy(source.#camera);
	}

	override getEngineEntity(): Camera {
		return this.#camera;
	}

	override getProperty(name: string): SerializablePropertyValue {
		switch (name) {
			case 'fov':
				return this.#camera.verticalFov;
			default:
				return super.getProperty(name);
		}
	}

	override  setProperty(name: string, value: SerializablePropertyValue): boolean {
		switch (name) {
			case 'fov':
				this.#camera.verticalFov = value as number;//TODO: check value type
				return true;
			default:
				return super.setProperty(name, value);
		}
	}

	setPredecessor(input: string, predecessor: SfmOperatorOutput): void {
		this.#inputs.set(input, predecessor);
	}

	static override getTypeName(): string {
		return 'Camera';
	}

	override getDefaultName(): string {
		return 'Camera';
	}
}

SfmSerializer.registerSerializable(SfmCamera);
