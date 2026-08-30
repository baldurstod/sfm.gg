import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmClip } from './clip';
import { SfmFilmClip } from './filmclip';
import { SfmSoundClip } from './soundclip';

export type SfmTrackType = 'channel' | 'sound' | 'effect' | 'film' | 'operator';

export interface TrackParameters extends SerializableParameters {
	/** Track type. Default to 'film' */
	trackType?: SfmTrackType;
}

export class SfmTrack extends Serializable {
	readonly isSfmTrack = true as const;
	#clips = new Set<SfmClip>();
	#trackType: SfmTrackType;
	mute = false;
	volume = 1;

	constructor(params: TrackParameters) {
		super(params);
		this.#trackType = params.trackType ?? 'film';
	}

	addClip(clip: SfmClip): SfmClip {
		if (
			this.#trackType === 'film' && !(clip as SfmFilmClip).isSfmFilmClip
			|| this.#trackType === 'sound' && !(clip as SfmSoundClip).isSfmSoundClip

		) {
			console.error('trying to add a clip of the wrong track type', clip, this);
			throw new Error('trying to add a clip of the wrong track type');
		}

		this.#clips.add(clip);
		return clip;
	}

	deleteClip(clip: SfmClip): void {
		this.#clips.delete(clip);
	}

	getClips(): SfmClip[] {
		return [...this.#clips];
	}

	getTrackType(): SfmTrackType {
		return this.#trackType;
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

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		if (json.clips) {
			for (const clipId of json.clips as string[]) {
				const clip = context.elements.get(clipId) as SfmClip | undefined; // TODO: check if it's actually a clip

				if (clip) {
					this.#clips.add(clip);
				}
			}
		}

		this.mute = json.mute as boolean ?? false;
		this.volume = json.volume as number ?? 1;

		this.#trackType = json.track_type as SfmTrackType | undefined ?? 'film';// TODO: check value
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
