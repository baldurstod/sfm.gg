import { Serializable, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmFilmClip } from './filmclip';

/*
export interface SessionParameters extends SerializableParameters {
}
*/

export class SfmSession extends Serializable {
	#activeClip?: SfmFilmClip;
	//#clips = new Set<SfmClip>();
	//#film = new SfmClip();

	/*
	addClip(clip: SfmClip): void {
		this.#clips.add(clip);
	}

	deleteClip(clip: SfmClip): void {
		this.#clips.delete(clip);
	}
	*/

	/*
	getFilm(): SfmFilm {
		return this.#film;
	}
	*/

	setActiveFilmClip(clip: SfmFilmClip): void {
		this.#activeClip = clip;
	}

	getActiveFilmClip(): SfmFilmClip | undefined {
		return this.#activeClip;
	}

	static override getTypeName(): string {
		return 'Session';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#activeClip) {
			json.active_clip = this.#activeClip;
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
