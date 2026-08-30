import { Serializable, SerializableParameters, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable } from '../serialize/serializer';
import { SfmTimeFrame, TimeFrameParameters } from './timeframe';

export interface ClipParameters extends SerializableParameters {
	timeFrame?: TimeFrameParameters;
}

export class SfmClip extends Serializable {
	readonly isSfmClip = true as const;
	#timeFrame: SfmTimeFrame//= new SfmTimeFrame();

	constructor(params: ClipParameters = {}) {
		super(params);
		this.#timeFrame = new SfmTimeFrame(params.timeFrame);
	}

	static override getTypeName(): string {
		return 'Clip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.time_frame = this.#timeFrame;

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		if (json.time_frame) {
			this.#timeFrame = (context.elements.get(json.time_frame as string) as SfmTimeFrame | undefined) ?? new SfmTimeFrame(); // TODO: check if it's actually a timeframe
		}
	}
}

//SfmSerializer.registerSerializable(SfmClip);
