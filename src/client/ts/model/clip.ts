import { Serializable } from '../serialize/serializable';
import { JSONSerializable } from '../serialize/serializer';
import { SfmCamera } from './camera';
import { SfmScene } from './scene';
import { SfmTimeFrame } from './timeframe';

/*
export interface ClipParameters extends SerializableParameters {
}
*/

export class SfmClip extends Serializable {
	readonly isSfmClip = true as const;
	#visible = true;
	#timeFrame = new SfmTimeFrame();

	static override getTypeName(): string {
		return 'Clip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.time_frame = this.#timeFrame;

		return json;
	}

	override unserialize(json: JSONSerializable, elements: Map<string, Serializable>): void {
		super.unserialize(json, elements);

		if (json.time_frame) {
			const timeFrame = elements.get(json.time_frame as string) as SfmTimeFrame | undefined; // TODO: check if it's actually a timeframe
			if (timeFrame) {
				this.#timeFrame = timeFrame;
			} else {
				this.#timeFrame.reset();
			}
		}
	}
}

//SfmSerializer.registerSerializable(SfmClip);
