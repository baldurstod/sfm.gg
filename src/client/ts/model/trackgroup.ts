import { Command, Undoable } from '../history/action';
import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmFilmClip } from './clips/filmclip';
import { SfmTrack } from './track';

export interface TrackGroupParameters extends SerializableParameters {
	/** Track group order. Default to 0 */
	order?: number;
}

export class SfmTrackGroup extends Serializable implements Undoable {
	readonly isSfmTrackGroup = true as const;
	parentClip: SfmFilmClip | null = null;
	readonly #tracks = new Set<SfmTrack>();
	#order = 0;

	constructor(params: TrackGroupParameters) {
		super(params);
		this.#order = params.order ?? 0;
	}

	#addTrack(track: SfmTrack): SfmTrack {
		this.#tracks.add(track);
		track.trackGroup = this;
		return track;
	}

	/*
	#addTracks(tracks: SfmTrack[]): void {
		tracks.forEach((track) => this.#tracks.add(track));
	}
	*/

	#deleteTrack(track: SfmTrack): void {
		this.#tracks.delete(track);
		track.trackGroup = null;
	}

	getTracks(): SfmTrack[] {
		return [...this.#tracks];
	}

	getOrder(): number {
		return this.#order;
	}

	getNextTrackOrder(): number {
		let order = -1;

		for (const trackGroup of this.#tracks) {
			order = Math.max(trackGroup.getOrder(), order);
		}

		return ++order;
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'add-track':
				command.undoParams = command.params.trackGroup;
				this.#addTrack(command.params);
				return true;
			case 'delete-track':
				if (!this.#tracks.has(command.params)) {
					return false;
				}
				command.undoParams = command.params;
				this.#deleteTrack(command.params);
				return true;
			case 'set-order':
				command.undoParams = this.#order;
				this.#order = command.params;
				return true;
			default:
				return super.do(command);
		}
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
			case 'delete-track':
				// Reattach the track
				this.#addTrack(command.undoParams);
				return true;
			case 'set-order':
				this.#order = command.undoParams;
				return true;
			default:
				return super.undo(command);
		}
	}

	static override getTypeName(): string {
		return 'TrackGroup';
	}

	override getDefaultName(): string {
		return 'Track group';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();
		json.order = this.#order;

		if (this.#tracks.size) {
			json.tracks = [...this.#tracks];
		}

		if (this.parentClip) {
			json.parent_clip = this.parentClip;
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);
		this.#order = json.order as number ?? 0;

		if (json.tracks) {
			for (const trackId of json.tracks as string[]) {
				const track = context.elements.get(trackId) as SfmTrack | undefined; // TODO: check if it's actually a track

				if (track) {
					this.#tracks.add(track);
				}
			}
		}

		this.parentClip = null;
		if (json.parent_clip) {
			this.parentClip = context.elements.get(json.parent_clip as string) as SfmFilmClip | null; // TODO: check if it's actually a film clip
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
