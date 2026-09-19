import { Serializable, SerializableParameters, SerializableProperty, UnserializationContext } from '../serialize/serializable';
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
	#start: number = 0;
	#duration: number = 60;
	#offset: number;

	constructor(params: TimeFrameParameters = {}) {
		super(params);

		if ((params.start !== undefined && params.end !== undefined) && params.end < params.start) {
			const tmp = params.start;
			params.start = params.end;
			params.end = tmp;
		}

		if (params.start !== undefined) {
			this.#start = params.start;
			if (params.end !== undefined) {
				this.#duration = params.end - params.start;
			} else {// params.end is undefined
				this.#duration = params.duration ?? 60;
			}
		} else {// params.start is undefined
			if (params.end !== undefined) {
				if (params.duration !== undefined) {
					this.#start = params.end - params.duration;
					this.#duration = params.duration;
				} else {// params.duration is undefined
					this.#duration = params.end;
				}
			} else {// params.end is undefined
				//this.#duration = 60;
				if (params.duration !== undefined) {
					this.#duration = params.duration;
				} else {// params.duration is undefined
					// Nothing to do
				}
			}
		}

		this.#offset = params.offset ?? 0;
	}

	getStart(): number {
		return this.#start;
	}

	getEnd(): number {
		return this.#start + this.#duration;
	}

	getDuration(): number {
		return this.#duration;
	}

	/**
	 * Change start time while keeping end time. Duration is changed in the process.
	 * Nothing is done if the new start time is after the end time
	 * @param start Start time
	 * @returns
	 */
	setStart(start: number): void {
		const end = this.getEnd();
		if (start >= end) {
			return;
		}

		this.#start = start;
		this.#duration = end - start;
	}

	/**
	 * Move the time frame. The duration is not changed.
	 * @param delta The time amount to move
	 */
	move(delta: number): void {
		this.#start += delta;
	}

	/**
	 * Change end time while keeping start time. Duration is changed in the process.
	 * Nothing is done if the new end time is before the start time
	 * @param start Start time
	 * @returns
	 */
	setEnd(end: number): void {
		const start = this.getStart();
		if (end <= start) {
			return;
		}
		this.#duration = end - start;
	}

	/**
	 * Check if a time is part of a time frame, bounds included
	 * @param time The time to check for
	 * @returns True if the time frame
	 */
	inTimeFrame(time: number): boolean {
		return time >= this.#start && time <= this.getEnd();
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

		const aEnd = a.getEnd();
		const bEnd = b.getEnd();

		// At this point, a start before or at the same time b
		if (aEnd >= bEnd) {
			// The timeframes overlap for the full duration of b
			return new SfmTimeFrame({ start: b.#start, duration: b.#duration });
		} else if (aEnd > b.#start) {
			// The timeframes overlap from the start of b to the end of a
			return new SfmTimeFrame({ start: b.#start, duration: aEnd - b.#start });
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
		const thisEnd = this.getEnd();
		const otherEnd = other.getEnd();

		if (this.#start < other.#start) {
			if (thisEnd <= other.#start) {
				// Case 1
				result.add(new SfmTimeFrame({ start: this.#start, end: thisEnd, }));
			} else {
				if (thisEnd <= otherEnd) {
					// Case 2
					result.add(new SfmTimeFrame({ start: this.#start, end: other.#start, }));
				} else {
					// Case 3
					result.add(new SfmTimeFrame({ start: this.#start, end: other.#start, }));
					result.add(new SfmTimeFrame({ start: otherEnd, end: thisEnd, }));
				}
			}
		} else if (this.#start === other.#start) {
			if (thisEnd <= otherEnd) {
				// Case 4: return an empty set
				return result;
			} else {
				// Case 5
				result.add(new SfmTimeFrame({ start: otherEnd, end: thisEnd, }));
			}
		} else {
			// case where this.#start > other.#start
			if (this.#start >= otherEnd) {
				// Case 6
				result.add(new SfmTimeFrame({ start: this.#start, end: thisEnd, }));
			} else {
				if (thisEnd > otherEnd) {
					// Case 7
					result.add(new SfmTimeFrame({ start: otherEnd, end: thisEnd, }));
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
		time.#duration = this.#duration;
		time.#offset = this.#offset;

		return time;
	}

	override getProperties(): SerializableProperty[] {
		return [];
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
		json.duration = this.#duration;
		json.offset = this.#offset;

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		// TODO: check json values
		this.#start = json.start as number ?? 0;
		this.#duration = json.duration as number ?? 60;
		this.#offset = json.offset as number ?? 0;
	}
}

SfmSerializer.registerSerializable(SfmTimeFrame);
