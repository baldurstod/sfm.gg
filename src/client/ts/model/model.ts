import { Entity } from 'harmony-3d';
import { SerializableProperty } from '../serialize/serializable';
import { SfmSerializer } from '../serialize/serializer';
import { SfmEntity } from './entity';

export class SfmModel extends SfmEntity {
	readonly isSfmModel = true as const;

	override getEngineEntity(): Entity {
		throw new Error('TODO');
	}

	override getProperties(): SerializableProperty[] {
		return [];
	}


	static override getTypeName(): string {
		return 'Model';
	}

	override getDefaultName(): string {
		return 'Model';
	}
}

SfmSerializer.registerSerializable(SfmModel);
