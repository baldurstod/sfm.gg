import { Command } from '../history/action';
import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyValue, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmFilmClip } from './clips/filmclip';
import { SessionSettingsParameters, SfmSessionSettings } from './settings/sessionsettings';


export interface SessionParameters extends SerializableParameters {
	settings?: SessionSettingsParameters;
	clip?: SfmFilmClip;
}


export class SfmSession extends Serializable {
	readonly isSfmSession = true as const;
	#filmClip?: SfmFilmClip;
	#settings: SfmSessionSettings;

	constructor(params: SessionParameters = {}) {
		super(params);
		this.#settings = new SfmSessionSettings(params.settings);
		this.#filmClip = params.clip;
	}

	getFilmClip(): SfmFilmClip | undefined {
		return this.#filmClip;
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'set-film-clip':
				command.undoParams = this.#filmClip;
				this.#filmClip = command.params;//TODO: check this is an SfmFilmClip
				return true;
			default:
				return super.do(command);
		}
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'set-film-clip':
				this.#filmClip = command.undoParams;
				return true;
			default:
				return super.undo(command);
		}
	}

	static override getTypeName(): string {
		return 'Session';
	}

	override getDefaultName(): string {
		return 'Session';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#filmClip) {
			json.top_clip = this.#filmClip;
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

		this.#filmClip = undefined;
		if (json.top_clip) {
			this.#filmClip = elements.get(json.top_clip as string) as SfmFilmClip | undefined; // TODO: check if it's actually a film clip
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
				name: 'filmClip',
				i18n: '#film_clip',
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
			case 'filmClip':
				return this.#filmClip;
			case 'settings':
				return this.#settings;
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmSession);
