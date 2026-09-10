import { Scene } from 'harmony-3d';
import { SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmEntity } from './entity';
import { SfmNode } from './node';

export class SfmScene extends SfmEntity {
	readonly isSfmScene = true as const;
	#scene = new Scene();

	#addChild(child: SfmNode): SfmNode | null {
		// TODO: check child
		/*
		if (child === this) {
			console.log('Cannot add a serializable as child of itself');
			return child;
		}
		if (this.hasDescendant(child)) {
			console.info(child, ' is already a child of ', this);
			return child;
		}
		*/
		//this.children.add(child);
		return child;
	}

	override getEngineEntity(): Scene {
		return this.#scene;
	}

	static override getTypeName(): string {
		return 'Scene';
	}

	override getDefaultName(): string {
		return 'Scene';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);
	}

	override getProperties(): SerializableProperty[] {

		return [
			{
				name: 'children',
				i18n: '#children',
				//type: typeof nodeArray,
				settable: false,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			//case 'children':
			//return [...this.children];
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmScene);
