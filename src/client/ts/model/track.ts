import { Serializable } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmClip } from './clip';

export class SfmTrack extends Serializable {
	readonly isSfmTrack = true as const;
	#clips = new Set<SfmClip>();

	static override getTypeName(): string {
		return 'Track';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#clips.size) {
			json.clips = [...this.#clips];
		}

		return json;
	}

	override unserialize(json: JSONSerializable, elements: Map<string, Serializable>): void {
		super.unserialize(json, elements);

		if (json.clips) {
			for (const clipId of json.clips as string[]) {
				const clip = elements.get(clipId) as SfmClip | undefined; // TODO: check if it's actually a clip

				if (clip) {
					this.#clips.add(clip);
				}
			}
		}
	}
}

SfmSerializer.registerSerializable(SfmTrack);
