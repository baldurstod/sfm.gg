import { SfmSerializer } from '../serialize/serializer';
import { SfmEntity } from './entity';

export class SfmModel extends SfmEntity {
	readonly isSfmModel = true as const;

	static override getTypeName(): string {
		return 'Model';
	}

	override getDefaultName(): string {
		return 'Model';
	}
}

SfmSerializer.registerSerializable(SfmModel);
