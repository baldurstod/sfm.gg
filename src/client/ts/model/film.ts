import { Serializable, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmTrackGroup } from './trackgroup';

export class SfmFilm extends Serializable {
	readonly isSfmFilm = true as const;
	#trackGroups = new Set<SfmTrackGroup>();

	addTrackGroup(group: SfmTrackGroup): SfmTrackGroup {
		this.#trackGroups.add(group);
		return group;
	}

	deleteTrackGroup(group: SfmTrackGroup): void {
		this.#trackGroups.delete(group);
	}

	static override getTypeName(): string {
		return 'Film';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#trackGroups.size) {
			json.track_groups = [...this.#trackGroups];
		}

		return json;
	}

	unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.#trackGroups.clear();

		if (json.track_groups) {
			for (const trackGroupId of json.track_groups as string[]) {
				const trackGroup = context.elements.get(trackGroupId) as SfmTrackGroup | undefined; // TODO: check if it's actually a track group

				if (trackGroup) {
					this.#trackGroups.add(trackGroup);
				}
			}
		}
	}
}

SfmSerializer.registerSerializable(SfmFilm);
