import { Serializable } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmClip } from './clip';

export class SfmSoundClip extends SfmClip {
	readonly isSfmSoundClip = true as const;
	#mute = false;
	volume = 1;
	mute = false;

	static override getTypeName(): string {
		return 'FilmClip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();
		return json;
	}

	override unserialize(json: JSONSerializable, elements: Map<string, Serializable>): void {
		super.unserialize(json, elements);
	}
}

SfmSerializer.registerSerializable(SfmSoundClip);
