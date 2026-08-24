import { Serializable } from '../serialize/serializable';
import { JSONSerializable, SFMSerializer } from '../serialize/serializer';
import { SfmClip } from './clip';

/*
export interface SessionParameters extends SerializableParameters {
}
*/

export class SfmSession extends Serializable {
	#activeClip?: SfmClip;
	#clips = new Set<SfmClip>();

	addClip(clip: SfmClip): void {
		this.#clips.add(clip);
	}

	deleteClip(clip: SfmClip): void {
		this.#clips.delete(clip);
	}

	setActiveClip(clip: SfmClip): boolean {
		if (this.#clips.has(clip)) {
			this.#activeClip = clip;
			return true;
		}
		return false;
	}

	getActiveClip(): SfmClip | undefined {
		return this.#activeClip;
	}

	static override getTypeName(): string {
		return 'Session';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#activeClip) {
			json.active_clip = this.#activeClip;
		}

		if (this.#clips.size) {
			json.clips = [...this.#clips];
		}

		return json;
	}

	override unserialize(json: JSONSerializable, elements: Map<string, Serializable>): void {
		super.unserialize(json, elements);

		this.#activeClip = undefined;
		this.#clips.clear();

		if (json.active_clip) {
			this.#activeClip = elements.get(json.active_clip as string) as SfmClip | undefined; // TODO: check if it's actually a clip
		}

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

SFMSerializer.registerSerializable(SfmSession);
