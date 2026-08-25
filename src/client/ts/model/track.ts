import { Serializable, SerializableParameters } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmClip } from './clip';
import { SfmFilmClip } from './filmclip';
import { SfmSoundClip } from './soundclip';

export type SfmTrackType = 'channel' | 'sound' | 'effect' | 'film';

export interface TrackParameters extends SerializableParameters {
	/** Track type. Default to 'film' */
	trackType?: SfmTrackType;
}

export class SfmTrack extends Serializable {
	readonly isSfmTrack = true as const;
	#clips = new Set<SfmClip>();
	#trackType: SfmTrackType = 'film';
	mute = false;
	volume = 1;

	constructor(params: TrackParameters = {}) {
		super(params);
		if (params.trackType) {
			this.#trackType = params.trackType;
		}
	}

	addClip(clip: SfmClip): SfmClip {
		switch (this.#trackType) {
			case 'film':
				if (!(clip as SfmFilmClip).isSfmFilmClip) {
					return clip;
				}
				break;
			case 'sound':
				if (!(clip as SfmSoundClip).isSfmSoundClip) {
					return clip;
				}
				break;
			default:
				console.error('trying to add a clip of the wrong type to a track', clip, this);
				throw new Error('trying to add a clip of the wrong type to a track');
		}

		this.#clips.add(clip);
		return clip;
	}

	deleteClip(clip: SfmClip): void {
		this.#clips.delete(clip);
	}

	static override getTypeName(): string {
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

		this.mute = json.mute as boolean ?? false;
		this.volume = json.volume as number ?? 1;

		this.#trackType = json.track_type as SfmTrackType | undefined ?? 'film';// TODO: check value
	}
}

SfmSerializer.registerSerializable(SfmTrack);
