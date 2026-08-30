import { Serializable, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';

export class SfmCurve extends Serializable {
	readonly isSfmCurve = true as const;
	readonly keys = new Set();

	static override getTypeName(): string {
		return 'Curve';
	}
}

SfmSerializer.registerSerializable(SfmCurve);
