import { UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmClip } from './clip';

export class SfmSoundClip extends SfmClip {
	readonly isSfmSoundClip = true as const;
	volume = 1;
	mute = false;

	static override getTypeName(): string {
		return 'FilmClip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.mute = this.mute;
		json.volume = this.volume;

		return json;
	}

	unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.mute = json.mute as boolean ?? false;
		this.volume = json.volume as number ?? 1;
	}
}

SfmSerializer.registerSerializable(SfmSoundClip);
