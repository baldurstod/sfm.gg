import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmFilmClip } from './clips/filmclip';
import { SessionSettingsParameters, SfmSessionSettings } from './settings/sessionsettings';


export interface SessionParameters extends SerializableParameters {
	settings?: SessionSettingsParameters;
}


export class SfmSession extends Serializable {
	readonly isSfmSession = true as const;
	#activeClip?: SfmFilmClip;
	#settings: SfmSessionSettings;

	constructor(params: SessionParameters = {}) {
		super(params);
		this.#settings = new SfmSessionSettings(params.settings);
	}

	setActiveFilmClip(clip: SfmFilmClip): void {
		this.#activeClip = clip;
	}

	getActiveFilmClip(): SfmFilmClip | undefined {
		return this.#activeClip;
	}

	static override getTypeName(): string {
		return 'Session';
	}

	override getDefaultName(): string {
		return 'Session';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#activeClip) {
			json.active_clip = this.#activeClip;
		}

		if (this.#settings) {
			json.settings = this.#settings;
		}

		/*
		if (this.#film) {
			json.film = this.#film;
		}
		*/
		/*

		if (this.#clips.size) {
			json.clips = [...this.#clips];
		}
		*/

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		const elements = context.elements;

		this.#activeClip = undefined;
		//this.#film = new SfmFilm();
		/*
		this.#clips.clear();
		*/

		if (json.active_clip) {
			this.#activeClip = elements.get(json.active_clip as string) as SfmFilmClip | undefined; // TODO: check if it's actually a film clip
		}

		if (json.settings) {
			this.#settings = (elements.get(json.settings as string) as SfmSessionSettings | undefined) ?? new SfmSessionSettings(); // TODO: check if it's actually a session settings
		}

		/*
		if (json.film) {
			const film = elements.get(json.film as string) as SfmFilm | undefined; // TODO: check if it's actually a film
			if (film) {
				this.#film = film;
			}
		}
		*/

		/*
		if (json.clips) {
			for (const clipId of json.clips as string[]) {
				const clip = elements.get(clipId) as SfmClip | undefined; // TODO: check if it's actually a clip

				if (clip) {
					this.#clips.add(clip);
				}
			}
		}
		*/
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'activeClip',
				i18n: '#active_clip',
				//type: typeof SfmFilmClip,
				settable: true,
			},
			/*
			{
				name: 'film',
				i18n: '#film',
				//type: typeof SfmFilmClip,
				settable: false,
			},
			*/
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			case 'activeClip':
				return this.#activeClip;
			/*
		case 'film':
			return this.#film;
			*/
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmSession);
