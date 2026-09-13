import { Box } from 'harmony-3d';
import { SerializableParameters, SerializableProperty, SerializablePropertyValue, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';
import { SfmEntity } from '../entity';
import { vec3 } from 'gl-matrix';

export interface PrimitiveBoxParameters extends SerializableParameters {
	/** Box size. Default to 1 */
	size?: number;
}

export class SfmPrimitiveBox extends SfmEntity {
	readonly isSfmPrimitive = true as const;
	#box = new Box();
	#size = vec3.fromValues(1, 1, 1);

	constructor(params: PrimitiveBoxParameters = {}) {
		super(params);
	}

	override getEngineEntity(): Box {
		return this.#box;
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'size',
				i18n: '#size',
				type: 'vec3',
				settable: true,
			},
		];
	}

	setProperty(name: string, value: SerializablePropertyValue): boolean {
		switch (name) {
			case 'size':
				// TODO: check type
				vec3.copy(this.#size, value as vec3);
				this.#setSize();
				return true;
			default:
				return false;
		}
	}

	setSubProperty(name: string, element: string, value: number): boolean {
		switch (name) {
			case 'size':
				switch (element) {
					case 'x':
						this.#size[0] = value;
						break;
					case 'y':
						this.#size[1] = value;
						break;
					case 'z':
						this.#size[2] = value;
						break;
					default:
						return false;
				}
				this.#setSize();
				return true;
			default:
				return false;
		}
	}

	#setSize(): void {
		this.#box.setSize(this.#size[0], this.#size[1], this.#size[2]);
	}

	static override getTypeName(): string {
		return 'PrimitiveBox';
	}

	override getDefaultName(): string {
		return 'Box';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();


		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

	}
}

SfmSerializer.registerSerializable(SfmPrimitiveBox);
