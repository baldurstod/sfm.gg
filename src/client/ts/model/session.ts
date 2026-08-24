import { Serializable } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmClip } from './clip';
import { SfmFilmClip } from './filmclip';

/*
export interface SessionParameters extends SerializableParameters {
}
*/

export class SfmSession extends Serializable {
	#activeClip?: SfmFilmClip;
	#clips = new Set<SfmClip>();

	addClip(clip: SfmClip): void {
		this.#clips.add(clip);
	}

	deleteClip(clip: SfmClip): void {
		this.#clips.delete(clip);
	}

	setActiveFilmClip(clip: SfmFilmClip): boolean {
		if (this.#clips.has(clip)) {
			this.#activeClip = clip;
			return true;
		}
		return false;
	}

	getActiveFilmClip(): SfmFilmClip | undefined {
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
			this.#activeClip = elements.get(json.active_clip as string) as SfmFilmClip | undefined; // TODO: check if it's actually a film clip
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

SfmSerializer.registerSerializable(SfmSession);
