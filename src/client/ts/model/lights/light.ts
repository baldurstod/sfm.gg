import { Serializable } from '../../serialize/serializable';

export abstract class SfmLight extends Serializable {
	readonly isSfmLight = true as const;
}
