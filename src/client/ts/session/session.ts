import { JSONObject } from 'harmony-types';
import { SFMSerializer, JSONSerializable } from '../serialize/serializer';
import { Serializable } from '../serialize/serializable';
import { Clip } from './clip';

/*
export interface SessionParameters extends SerializableParameters {
}
*/

export class Session extends Serializable {
	#activeClip: Clip | null = null;
	#clips = new Set<Clip>();

	addClip(clip: Clip): void {
		this.#clips.add(clip);
	}

	deleteClip(clip: Clip): void {
		this.#clips.delete(clip);
	}

	setActiveClip(clip: Clip): boolean {
		if (this.#clips.has(clip)) {
			this.#activeClip = clip;
			return true;
		}
		return false;
	}

	getActiveClip(): Clip | null {
		return this.#activeClip;
	}

	static override getTypeName(): string {
		return 'Session';
	}

	/*
	static override async constructFromJSON(json: JSONObject): Promise<Session> {
		return new Session(json);
	}
	*/

	override serialize(json: JSONObject, elements: Map<string, Serializable>): void {
		super.serialize(json, elements);
	}

	override unserialize(): JSONSerializable {
		const json = super.unserialize();

		if (this.#activeClip) {
			json.active_clip = this.#activeClip;

		}


		return json;
	}
}

SFMSerializer.registerSerializable(Session);
