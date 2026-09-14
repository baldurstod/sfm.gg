import { Serializable } from '../../serialize/serializable';

export type SfmLightType = 'point';

export abstract class SfmLight extends Serializable {
	readonly isSfmLight = true as const;
}
