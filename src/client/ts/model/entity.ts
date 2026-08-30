import { JSONObject } from 'harmony-types';
import { Serializable, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';

export type SfmEntityPropertyValue = string | number | Serializable | Serializable[];

export class SfmEntity extends Serializable {
	readonly isSfmEntity = true as const;
	readonly properties = new Map<string, SfmEntityPropertyValue>();

	static override getTypeName(): string {
		return 'Entity';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.properties.size) {
			json.properties = Object.fromEntries(this.properties) as JSONObject;
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.properties.clear();
		const properties = json.properties as JSONObject;
		if (properties) {
			for (const key in properties) {
				const value = properties[key] as SfmEntityPropertyValue;// TODO: check the value
				this.properties.set(key, value);
			}
		}
	}
}

SfmSerializer.registerSerializable(SfmEntity);
