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
	/** Track group order. Default to 0 */
	order?: number;
}

export class SfmTrack extends Serializable implements Undoable {
	readonly isSfmTrack = true as const;
	trackGroup: SfmTrackGroup | null = null;
	#clips = new Set<SfmClip>();
	#trackType: SfmClipType;
	mute = false;
	volume = 1;
	#order = 0;

	constructor(params: TrackParameters) {
		super(params);
		this.#trackType = params.trackType ?? 'film';
		this.#order = params.order ?? 0;

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

	getGaps(start: number = -Infinity, end: number = Infinity): Set<SfmTimeFrame> {
		const gaps = new Set<SfmTimeFrame>([new SfmTimeFrame({ start, end })]);

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

	getOrder(): number {
		return this.#order;
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'add-clip':
				command.undoParams = command.params.track;
				this.#addClip(command.params);
				return true;
			case 'delete-clip':
				if (!this.#clips.has(command.params)) {
					return false;
				}
				command.undoParams = command.params;
				this.#deleteClip(command.params);
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
			case 'add-clip':
				// Delete the clip from this track
				this.#deleteClip(command.params);

				// Reattach the clip to the previous track, if any
				const previousTrack = command.undoParams as SfmTrack;
				if (previousTrack) {
					previousTrack.#addClip(command.params);
				}
				return true;
			case 'delete-clip':
				// Reattach the clip to this track
				this.#addClip(command.undoParams);
				return true;
			case 'set-order':
				this.#order = command.undoParams;
				return true;
			default:
				return super.undo(command);
		}
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

		if (this.trackGroup) {
			json.track_group = this.trackGroup;
		}
		json.track_type = this.#trackType;
		json.mute = this.mute;
		json.volume = this.volume;
		json.order = this.#order;

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

		this.trackGroup = null;
		if (json.track_group) {
			this.trackGroup = context.elements.get(json.track_group as string) as SfmTrackGroup | null; // TODO: check if it's actually a track group
		}

		this.mute = json.mute as boolean ?? false;
		this.volume = json.volume as number ?? 1;
		this.#order = json.order as number ?? 0;

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
