import { Serializable } from '../../serialize/serializable';
import { SfmSerializer } from '../../serialize/serializer';

export class SfmBooleanAttribute extends Serializable {
	readonly isSfmBooleanAttribute = true as const;

	static override getTypeName(): string {
		return 'BooleanAttribute';
	}

	override getDefaultName(): string {
		return 'Boolean attribute';
	}
}

SfmSerializer.registerSerializable(SfmBooleanAttribute);
