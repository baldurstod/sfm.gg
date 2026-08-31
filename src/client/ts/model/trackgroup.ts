import { Serializable, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmTrack } from './track';

export class SfmTrackGroup extends Serializable {
	readonly isSfmTrackGroup = true as const;
	readonly #tracks = new Set<SfmTrack>();

	addTrack(track: SfmTrack): SfmTrack {
		this.#tracks.add(track);
		return track;
	}

	addTracks(tracks: SfmTrack[]): void {
		tracks.forEach((track) => this.#tracks.add(track));
	}

	deleteTrack(track: SfmTrack): void {
		this.#tracks.delete(track);
	}

	getTracks(): SfmTrack[] {
		return [...this.#tracks];
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

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
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

	override getProperties(): SerializableProperty[] {

		return [
			{
				name: 'tracks',
				i18n: '#tracks',
				//type: typeof nodeArray,
				settable: false,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			case 'tracks':
				return [...this.#tracks];
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmTrackGroup);
