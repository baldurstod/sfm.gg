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
