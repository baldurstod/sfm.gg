import { Serializable } from '../serialize/serializable';

export abstract class SfmWorld extends Serializable {
	readonly isSfmWorld = true as const;
}
