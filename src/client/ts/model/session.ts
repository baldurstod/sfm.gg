import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyValue, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmFilmClip } from './clips/filmclip';
import { SessionSettingsParameters, SfmSessionSettings } from './settings/sessionsettings';


export interface SessionParameters extends SerializableParameters {
	settings?: SessionSettingsParameters;
}


export class SfmSession extends Serializable {
	readonly isSfmSession = true as const;
	#topClip?: SfmFilmClip;
	#settings: SfmSessionSettings;

	constructor(params: SessionParameters = {}) {
		super(params);
		this.#settings = new SfmSessionSettings(params.settings);
	}

	setTopFilmClip(clip: SfmFilmClip): void {
		this.#topClip = clip;
	}

	getTopFilmClip(): SfmFilmClip | undefined {
		return this.#topClip;
	}

	static override getTypeName(): string {
		return 'Session';
	}

	override getDefaultName(): string {
		return 'Session';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#topClip) {
			json.top_clip = this.#topClip;
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

		//this.#film = new SfmFilm();
		/*
		this.#clips.clear();
		*/

		this.#topClip = undefined;
		if (json.top_clip) {
			this.#topClip = elements.get(json.top_clip as string) as SfmFilmClip | undefined; // TODO: check if it's actually a film clip
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
				name: 'topClip',
				i18n: '#top_clip',
				type: 'element',
				settable: true,
			},
			{
				name: 'settings',
				i18n: '#settings',
				type: 'element',
				settable: false,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyValue {
		switch (name) {
			case 'topClip':
				return this.#topClip;
			case 'settings':
				return this.#settings;
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmSession);
