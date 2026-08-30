import { Serializable } from '../../serialize/serializable';
import { SfmSerializer } from '../../serialize/serializer';

export class SfmAttribute extends Serializable {
	readonly isSfmAttribute = true as const;

	static override getTypeName(): string {
		return 'Attribute';
	}
}

SfmSerializer.registerSerializable(SfmAttribute);
