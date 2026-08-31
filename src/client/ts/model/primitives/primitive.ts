import { Serializable, SerializableParameters, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable } from '../../serialize/serializer';

export interface PrimitiveParameters extends SerializableParameters {
	/** Start time. Default to 0 */
	start?: number;
	/** Duration. Default to 60 */
	duration?: number;
	/** Offset. Default to 0 */
	offset?: number;
}

export abstract class SfmPrimitive extends Serializable {
	readonly isSfmPrimitive = true as const;

	constructor(params: PrimitiveParameters = {}) {
		super(params);
	}

	static override getTypeName(): string {
		return 'Primitive';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();


		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

	}
}
