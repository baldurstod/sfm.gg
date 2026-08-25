import { Serializable, SerializableParameters } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';

export interface TimeFrameParameters extends SerializableParameters {
	/** Start time. Default to 0 */
	start?: number;
	/** Duration. Default to 60 */
	duration?: number;
	/** Offset. Default to 0 */
	offset?: number;
}

export class SfmTimeFrame extends Serializable {
	readonly isSfmTimeFrame = true as const;
	#start = 0;
	#duration = 0;
	#offset = 0;

	constructor(params: TimeFrameParameters = {}) {
		super(params);

		this.#start = params.start ?? 0;
		this.#duration = params.duration ?? 60;
		this.#offset = params.offset ?? 0;
	}

	reset() {
		this.#start = 0;
		this.#duration = 0;
		this.#offset = 0;
	}

	static override getTypeName(): string {
		return 'TimeFrame';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.start = this.#start;
		json.duration = this.#duration;
		json.offset = this.#offset;

		return json;
	}

	override unserialize(json: JSONSerializable, elements: Map<string, Serializable>): void {
		super.unserialize(json, elements);

		this.#start = json.start as number ?? 0;
		this.#duration = json.duration as number ?? 0;
		this.#offset = json.offset as number ?? 0;
	}
}

SfmSerializer.registerSerializable(SfmTimeFrame);
