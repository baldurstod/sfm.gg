import { Serializable } from '../../serialize/serializable';

export abstract class SfmCurve extends Serializable {
	readonly isSfmCurve = true as const;
	readonly keys = new Set();

	static override getTypeName(): string {
		return 'Curve';
	}
}
