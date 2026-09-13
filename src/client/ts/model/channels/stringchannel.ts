import { Serializable, SerializableProperty } from '../../serialize/serializable';
import { SfmSerializer } from '../../serialize/serializer';

export class SfmStringChannel extends Serializable {
	readonly isSfmChannel = true as const;

	override getProperties(): SerializableProperty[] {
		return [];
	}

	static override getTypeName(): string {
		return 'StringChannel';
	}

	override getDefaultName(): string {
		return 'String channel';
	}

}

SfmSerializer.registerSerializable(SfmStringChannel);
