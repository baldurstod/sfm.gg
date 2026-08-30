import { Serializable } from '../../serialize/serializable';
import { SfmSerializer } from '../../serialize/serializer';

export class SfmStringChannel extends Serializable {
	readonly isSfmChannel = true as const;

	static override getTypeName(): string {
		return 'StringChannel';
	}
}

SfmSerializer.registerSerializable(SfmStringChannel);
