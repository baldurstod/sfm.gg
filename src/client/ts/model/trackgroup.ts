import { Serializable, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmTrack } from './track';

export class SfmTrackGroup extends Serializable {
	readonly isSfmTrackGroup = true as const;
	readonly #tracks = new Set<SfmTrack>();

	addTrack(track: SfmTrack): SfmTrack {
		this.#tracks.add(track);
		return track;
	}

	deleteTrack(track: SfmTrack): void {
		this.#tracks.delete(track);
	}

	static override getTypeName(): string {
		return 'TrackGroup';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#tracks.size) {
			json.tracks = [...this.#tracks];
		}

		return json;
	}

	unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		if (json.tracks) {
			for (const trackId of json.tracks as string[]) {
				const track = context.elements.get(trackId) as SfmTrack | undefined; // TODO: check if it's actually a track

				if (track) {
					this.#tracks.add(track);
				}
			}
		}
	}
}

SfmSerializer.registerSerializable(SfmTrackGroup);
