
export type CurveKeyType = boolean | number | string;

/**
 * CurveKey represent a single key in a bézier curve
 */
export class CurveKey<T extends CurveKeyType> {
	// Time position of cp in, key, cp out
	readonly times: [number, number, number]// = [0, 0, 0];
	// Time position of cp in, key, cp out
	readonly values: [T, T, T];

	constructor(time: number, value: T) {
		this.times = [time, time, time];
		this.values = [value, value, value];
	}

	getTimeIn(): number {
		return this.times[0];
	}

	getTime(): number {
		return this.times[1];
	}

	getTimeOut(): number {
		return this.times[2];
	}

	getValueIn(): CurveKeyType {
		return this.values[0];
	}

	getValue(): CurveKeyType {
		return this.values[1];
	}

	getValueOut(): CurveKeyType {
		return this.values[2];
	}

}
