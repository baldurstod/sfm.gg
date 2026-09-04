import { Command, Undoable } from '../history/action';
import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmClip, SfmClipType } from './clips/clip';
import { SfmFilmClip } from './clips/filmclip';
import { SfmSoundClip } from './clips/soundclip';
import { SfmTimeFrame } from './timeframe';
import { SfmTrackGroup } from './trackgroup';

export interface TrackParameters extends SerializableParameters {
	/** Track type. Default to 'film' */
	trackType?: SfmClipType;
}

export class SfmTrack extends Serializable implements Undoable {
	readonly isSfmTrack = true as const;
	trackGroup: SfmTrackGroup | null = null;
	#clips = new Set<SfmClip>();
	#trackType: SfmClipType;
	mute = false;
	volume = 1;

	constructor(params: TrackParameters) {
		super(params);
		this.#trackType = params.trackType ?? 'film';

		this.#clips[Symbol.iterator] = function* (): SetIterator<SfmClip> {
			yield* [...this.keys()].sort(
				(a, b) => {
					return a.getStart() < b.getStart() ? -1 : 1;
				}
			);
		};
	}

	#addClip(clip: SfmClip): SfmClip {
		if (
			this.#trackType === 'film' && !(clip as SfmFilmClip).isSfmFilmClip
			|| this.#trackType === 'sound' && !(clip as SfmSoundClip).isSfmSoundClip

		) {
			console.error('trying to add a clip of the wrong track type', clip, this);
			throw new Error('trying to add a clip of the wrong track type');
		}

		this.#addClip2(clip);

		return clip;
	}

	#addClip2(clip: SfmClip): void {
		// Remove the clip from the previous track
		if (clip.track) {
			clip.track.#deleteClip(clip);
		}
		clip.track = this;

		this.#clips.add(clip);
	}

	#deleteClip(clip: SfmClip): void {
		this.#clips.delete(clip);
		clip.track = null;
	}

	getClips(): SfmClip[] {
		return [...this.#clips];
	}

	getTrackType(): SfmClipType {
		return this.#trackType;
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'add-clip':
				command.undoParams = command.params.track;
				this.#addClip(command.params);
				return true;
		}

		return false;
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'add-clip':
				// Delete the clip from this track
				this.#deleteClip(command.params);

				// Reattach the clip to the previous track, if any
				const previousTrack = command.undoParams as SfmTrack;
				if (previousTrack) {
					previousTrack.#addClip(command.params);
				}
				return true;
		}

		return false;
	}

	getGaps(): Set<SfmTimeFrame> {
		const gaps = new Set<SfmTimeFrame>([new SfmTimeFrame({ start: -Infinity, end: Infinity })]);

		for (const clip of this.#clips) {
			for (const gap of gaps) {
				const overlap = clip.overlapTimeFrame(gap);
				if (!overlap) {
					continue;
				}

				const result = gap.subtract(clip.getTimeFrame());
				gaps.delete(gap);

				result.forEach(gap => gaps.add(gap));
			}
		}

		return gaps;
	}

	static override getTypeName(): string {
		return 'Track';
	}

	override getDefaultName(): string {
		return 'Track';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#clips.size) {
			json.clips = [...this.#clips];
		}

		json.track_type = this.#trackType;
		json.mute = this.mute;
		json.volume = this.volume;

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		if (json.clips) {
			for (const clipId of json.clips as string[]) {
				const clip = context.elements.get(clipId) as SfmClip | undefined; // TODO: check if it's actually a clip

				if (clip) {
					this.#addClip2(clip);
				}
			}
		}

		this.mute = json.mute as boolean ?? false;
		this.volume = json.volume as number ?? 1;

		this.#trackType = json.track_type as SfmClipType | undefined ?? 'film';// TODO: check value
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'clips',
				i18n: '#clips',
				//type: typeof nodeArray,
				settable: false,
			},
			{
				name: 'trackType',
				i18n: '#track_type',
				//type: typeof nodeArray,
				settable: true,
			},
			{
				name: 'mute',
				i18n: '#mute',
				//type: typeof nodeArray,
				settable: true,
			},
			{
				name: 'volume',
				i18n: '#volume',
				//type: typeof nodeArray,
				settable: true,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			case 'clips':
				return [...this.#clips];
			case 'trackType':
				return this.#trackType;
			case 'mute':
				return this.mute;
			case 'volume':
				return this.volume;
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmTrack);
