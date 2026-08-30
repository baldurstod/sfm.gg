import { SerializableParameters, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';
import { SfmEntity } from '../entity';

export interface PrimitiveBoxParameters extends SerializableParameters {
	/** Box size. Default to 1 */
	size?: number;
}

export class SfmPrimitiveBox extends SfmEntity {
	readonly isSfmPrimitive = true as const;

	constructor(params: PrimitiveBoxParameters = {}) {
		super(params);
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

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'TODO',
				i18n: '#TODO',
				settable: true,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			case 'TODO':
				return 'TODO';
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmPrimitiveBox);
