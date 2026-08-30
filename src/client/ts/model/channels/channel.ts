import { Serializable } from '../../serialize/serializable';
import { SfmSerializer } from '../../serialize/serializer';

export class SfmChannel extends Serializable {
	readonly isSfmChannel = true as const;

	static override getTypeName(): string {
		return 'Channel';
	}
}

SfmSerializer.registerSerializable(SfmChannel);
