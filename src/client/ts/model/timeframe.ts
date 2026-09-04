import { Serializable, SerializableParameters, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';

export interface TimeFrameParameters extends SerializableParameters {
	/** Start time. Default to 0 */
	start?: number;
	/** End time. Default to 60 */
	end?: number;
	/** Duration. Default to 60. Ignored if start, end are defined */
	duration?: number;
	/** Offset. Default to 0 */
	offset?: number;
}

export class SfmTimeFrame extends Serializable {
	readonly isSfmTimeFrame = true as const;
	#start: number;
	#end: number;
	#offset: number;

	constructor(params: TimeFrameParameters = {}) {
		super(params);

		this.#start = params.start ?? 0;
		this.#end = params.end ?? 60;

		if (params.duration !== undefined && (params.start === undefined || params.end === undefined)) {
			if (params.start === undefined && params.end !== undefined) {
				this.#start = params.end - params.duration;
			}

			if (params.end === undefined && params.start !== undefined) {
				this.#end = params.start + params.duration;
			}

			if (params.start === undefined && params.end === undefined) {
				this.#end = this.#start + params.duration;
			}
		}

		if (this.#start > this.#end) {
			let a = this.#start;
			this.#start = this.#end;
			this.#end = a;
		}

		this.#offset = params.offset ?? 0;
	}

	getStart(): number {
		return this.#start;
	}

	getEnd(): number {
		return this.#end;
	}

	getDuration(): number {
		return this.#end - this.#start;
	}

	/**
	 * Change start time while keeping end time. Duration is changed in the process.
	 * Nothing is done if the new start time is after the end time
	 * @param start Start time
	 * @returns
	 */
	setStart(start: number): void {
		if (start >= this.#end) {
			return;
		}
		this.#start = start;
	}

	/**
	 * Move the start time. The duration is not changed.
	 * @param start Start time
	 */
	moveStart(start: number): void {
		const delta = start - this.#start;
		this.#start = start;
		this.#start = this.#end + delta;
	}

	/**
	 * Change end time while keeping start time. Duration is changed in the process.
	 * Nothing is done if the new end time is before the start time
	 * @param start Start time
	 * @returns
	 */
	setEnd(end: number): void {
		if (end <= this.#start) {
			return;
		}
		this.#end = end;
	}

	inTimeFrame(time: number): boolean {
		return time >= this.#start && time < this.#start + this.#end;
	}

	/**
	 * Test if 2 timeframes overlap
	 * @param other The other timeframe
	 * @returns A timeframe containing the overlaping part of both timeframes, or null if there is no overlap
	 */
	overlap(other: SfmTimeFrame): SfmTimeFrame | null {
		let a: SfmTimeFrame = this;
		let b: SfmTimeFrame = other;

		if (a.#start > b.#start) {
			let tmp = a;
			a = b;
			b = tmp;
		}

		// At this point, a start before or at the same time b
		if (a.#end >= b.#end) {
			// The timeframes overlap for the full duration of b
			return new SfmTimeFrame({ start: b.#start, end: b.#end });
		} else if (a.#end > b.#start) {
			// The timeframes overlap from the start of b to the end of a
			return new SfmTimeFrame({ start: b.#start, end: a.#end });
		}

		// No overlap
		return null;
	}

	/**
	 * Subtract other timeframe from this one
	 * @param other Timeframe to subtract from this
	 * @returns A set containing 0, 1 or 2 timeframes depending on the configuration
	 */
	subtract(other: SfmTimeFrame): Set<SfmTimeFrame> {
		const result = new Set<SfmTimeFrame>();
		/**
		 * 1.
		 * this   ----------------
		 * other                        ----------------
		 * result ----------------
		 * 2.
		 * this   ----------------
		 * other     ----------------
		 * result ---
		 * 3.
		 * this   ----------------
		 * other     -----------
		 * result ---           --
		 * 4.
		 * this   ----------------
		 * other  -------------------
		 * result
		 * 5.
		 * this   ----------------
		 * other  --------------
		 * result               --
		 * 6.
		 * this                    ----------------
		 * other  ----------------
		 * result                  ----------------
		 * 7.
		 * this      ----------------
		 * other  -----------
		 * result            --------
		 * 8.
		 * this      ----------------
		 * other  ----------------------
		 * result
		 */

		if (this.#start < other.#start) {
			if (this.#end <= other.#start) {
				// Case 1
				result.add(new SfmTimeFrame({ start: this.#start, end: this.#end, }));
			} else {
				if (this.#end <= other.#end) {
					// Case 2
					result.add(new SfmTimeFrame({ start: this.#start, end: other.#start, }));
				} else {
					// Case 3
					result.add(new SfmTimeFrame({ start: this.#start, end: other.#start, }));
					result.add(new SfmTimeFrame({ start: other.#end, end: this.#end, }));
				}
			}
		} else if (this.#start === other.#start) {
			if (this.#end <= other.#end) {
				// Case 4: return an empty set
				return result;
			} else {
				// Case 5
				result.add(new SfmTimeFrame({ start: other.#end, end: this.#end, }));
			}
		} else {
			// case where this.#start > other.#start
			if (this.#start >= other.#end) {
				// Case 6
				result.add(new SfmTimeFrame({ start: this.#start, end: this.#end, }));
			} else {
				if (this.#end > other.#end) {
					// Case 7
					result.add(new SfmTimeFrame({ start: other.#end, end: this.#end, }));
				} else {
					// Case 8
				}
			}
		}

		return result;
	}

	clone(): SfmTimeFrame {
		const time = new SfmTimeFrame();

		time.#start = this.#start;
		time.#end = this.#end;
		time.#offset = this.#offset;

		return time;
	}

	static override getTypeName(): string {
		return 'TimeFrame';
	}

	override getDefaultName(): string {
		return 'Time frame';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.start = this.#start;
		json.duration = this.#end;
		json.offset = this.#offset;

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		// TODO: check json values
		this.#start = json.start as number ?? 0;
		this.#end = json.duration as number ?? 60;
		this.#offset = json.offset as number ?? 0;
	}
}

SfmSerializer.registerSerializable(SfmTimeFrame);
