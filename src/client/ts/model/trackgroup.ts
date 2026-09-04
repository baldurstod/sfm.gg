import { Command, Undoable } from '../history/action';
import { Serializable, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmTrack } from './track';

export class SfmTrackGroup extends Serializable implements Undoable {
	readonly isSfmTrackGroup = true as const;
	readonly #tracks = new Set<SfmTrack>();

	#addTrack(track: SfmTrack): SfmTrack {
		this.#tracks.add(track);
		return track;
	}

	#addTracks(tracks: SfmTrack[]): void {
		tracks.forEach((track) => this.#tracks.add(track));
	}

	#deleteTrack(track: SfmTrack): void {
		this.#tracks.delete(track);
	}

	getTracks(): SfmTrack[] {
		return [...this.#tracks];
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'add-track':
				command.undoParams = command.params.trackGroup;
				this.#addTrack(command.params);
				return true;
		}

		return false;
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'add-track':
				// Delete the track from this group
				this.#deleteTrack(command.params);

				// Reattach the clip to the previous track, if any
				const previousTrackGroup = command.undoParams as SfmTrackGroup;
				if (previousTrackGroup) {
					previousTrackGroup.#addTrack(command.params);
				}
				return true;
		}

		return false;
	}

	static override getTypeName(): string {
		return 'TrackGroup';
	}

	override getDefaultName(): string {
		return 'Track group';
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
