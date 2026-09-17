import { SfmEntity } from '../entity';

export type SfmLightType = 'point' | 'ambient';

export abstract class SfmLight extends SfmEntity {
	readonly isSfmLight = true as const;
}
