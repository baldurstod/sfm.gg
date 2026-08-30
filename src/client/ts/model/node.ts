import { Serializable, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmEntity } from './entity';

export class SfmNode extends Serializable {
	readonly isSfmNode = true as const;
	entity?: SfmEntity;

	static override getTypeName(): string {
		return 'Node';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.entity) {
			json.entity = this.entity;
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		if (json.entity) {
			this.entity = context.elements.get(json.entity as string) as SfmEntity | undefined; // TODO: check if it's actually an entity
		}
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'entity',
				i18n: '#entity',
				settable: true,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			case 'entity':
				return this.entity;
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmNode);
