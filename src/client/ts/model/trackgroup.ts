import { Command, Undoable } from '../history/action';
import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyValue, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmFilmClip } from './clips/filmclip';
import { SfmTrack } from './track';

export interface TrackGroupParameters extends SerializableParameters {
	/** Track group order. Default to 0 */
	order?: number;
}

export class SfmTrackGroup extends Serializable implements Undoable {
	readonly isSfmTrackGroup = true as const;
	#parentClip: SfmFilmClip | null = null;
	readonly #tracks = new Set<SfmTrack>();
	#order = 0;

	constructor(params: TrackGroupParameters) {
		super(params);
		this.#order = params.order ?? 0;
	}

	#addTrack(track: SfmTrack): void {
		this.#tracks.add(track);
	}

	#deleteTrack(track: SfmTrack): void {
		this.#tracks.delete(track);
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

	getParentClip(): SfmFilmClip | null {
		return this.#parentClip;
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'add-track':
				const addedTrack = command.params as SfmTrack;
				command.undoParams = addedTrack.getTrackGroup();
				this.#addTrack(addedTrack);
				command.addAndExecuteSubCommand(new Command(addedTrack, 'set-track-group', this));
				return true;
			case 'delete-track':
				if (!this.#tracks.has(command.params as SfmTrack)) {
					return false;
				}
				command.undoParams = command.params as SfmTrack;
				this.#deleteTrack(command.params as SfmTrack);
				command.addAndExecuteSubCommand(new Command(command.params as SfmTrack, 'set-track-group', null));
				return true;
			case 'set-order':
				command.undoParams = this.#order;
				this.#order = command.params as number;
				return true;
			case 'set-parent-clip':
				command.undoParams = this.#parentClip;
				this.#parentClip = command.params as SfmFilmClip | null;//TODO: check if it is actually an SfmFilmClip
				return true;
			default:
				return super.do(command);
		}
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'add-track':
				// Delete the track from this group
				this.#deleteTrack(command.params as SfmTrack);

				// Reattach the clip to the previous track, if any
				const previousTrackGroup = command.undoParams as SfmTrackGroup;
				if (previousTrackGroup) {
					previousTrackGroup.#addTrack(command.params as SfmTrack);
				}
				return true;
			case 'delete-track':
				// Reattach the track
				this.#addTrack(command.undoParams as SfmTrack);
				return true;
			case 'set-order':
				this.#order = command.undoParams as number;
				return true;
			case 'set-track-group':
				this.#parentClip = command.undoParams as SfmFilmClip | null;
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

		if (this.#parentClip) {
			json.parent_clip = this.#parentClip;
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

		this.#parentClip = null;
		if (json.parent_clip) {
			this.#parentClip = context.elements.get(json.parent_clip as string) as SfmFilmClip | null; // TODO: check if it's actually a film clip
		}
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'tracks',
				i18n: '#tracks',
				type: 'element_array',
				settable: false,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyValue {
		switch (name) {
			case 'tracks':
				return [...this.#tracks];
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmTrackGroup);
