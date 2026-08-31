import { Serializable } from '../../serialize/serializable';

export abstract class SfmChannel extends Serializable {
	readonly isSfmChannel = true as const;

	static override getTypeName(): string {
		return 'Channel';
	}
}
