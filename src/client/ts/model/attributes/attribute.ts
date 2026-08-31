import { Serializable } from '../../serialize/serializable';

export abstract class SfmAttribute extends Serializable {
	readonly isSfmAttribute = true as const;

	static override getTypeName(): string {
		return 'Attribute';
	}
}
