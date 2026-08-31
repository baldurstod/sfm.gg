import { Serializable } from '../../serialize/serializable';
import { SfmSerializer } from '../../serialize/serializer';

export class SfmStringAttribute extends Serializable {
	readonly isSfmStringAttribute = true as const;

	static override getTypeName(): string {
		return 'StringAttribute';
	}

	override getDefaultName(): string {
		return 'String attribute';
	}

}

SfmSerializer.registerSerializable(SfmStringAttribute);
