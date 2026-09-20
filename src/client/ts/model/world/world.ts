import { SfmEntity } from '../entity';

export abstract class SfmWorld extends SfmEntity {
	readonly isSfmWorld = true as const;
}
