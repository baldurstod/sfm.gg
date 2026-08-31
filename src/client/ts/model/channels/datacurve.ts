import { Serializable, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable } from '../../serialize/serializer';
import { CurveKey, CurveKeyType } from './curvekey';

export type SfmDataCurveType =
	// Constant value
	'contant'
	// Linear interpolation
	| 'linear'
	// Cubic Bézier curve
	| 'cubic-bezier'
	;

export abstract class SfmDataCurve extends Serializable {
	readonly isSfmDataCurve = true as const;
	//readonly controlPoints = new Set();
	readonly keys: Set<CurveKey<any>>[] = [];
	curveType: SfmDataCurveType = 'linear';
	readonly curveCount: number = 1;

	static override getTypeName(): string {
		return 'DataCurve';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.curve_type = this.curveType;

		// Serialize curves
		if (this.keys.length) {
			const keys: (number | CurveKeyType)[] = [];
			for (const curve of this.keys) {
				for (const key of curve) {
					keys.push(...key.times);
					keys.push(...key.values);
				}
			}
			json.keys = keys;
		}
		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.curveType = json.curve_type as SfmDataCurveType;//TODO: check the actual value
	}
}
