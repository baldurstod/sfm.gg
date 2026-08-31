import { vec3 } from 'gl-matrix';
import { Serializable, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';
import { CurveKey } from './curvekey';
import { SfmDataCurve, SfmDataCurveType } from './datacurve';

export class SfmDataCurveVector3 extends SfmDataCurve {
	readonly isSfmDataCurveVector3 = true as const;
	readonly keys: [Set<CurveKey<number>>, Set<CurveKey<number>>, Set<CurveKey<number>>,] = [new Set(), new Set(), new Set()];
	curveType: SfmDataCurveType = 'linear';
	readonly curveCount = 3;

	static override getTypeName(): string {
		return 'DataCurveVector3';
	}

	override getDefaultName(): string {
		return 'Data curve vector3';
	}

	getValueAtTime(time: number): vec3 {
		return vec3.create();
	}

	addKeyAtTime(time: number, key: vec3): void {
		this.keys[0].add(new CurveKey<number>(time, key[0]));
		this.keys[1].add(new CurveKey<number>(time, key[1]));
		this.keys[2].add(new CurveKey<number>(time, key[2]));
	}
}

SfmSerializer.registerSerializable(SfmDataCurveVector3);
