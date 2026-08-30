import { Scene } from 'harmony-3d';
import { Serializable, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmNode } from './node';

export class SfmScene extends Serializable {
	readonly isSfmScene = true as const;
	#scene = new Scene();
	protected readonly children = new Set<SfmNode>();


	addChild(child: SfmNode): SfmNode | null {
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
		this.children.add(child);
		return child;
	}


	getScene(): Scene {
		return this.#scene;
	}

	static override getTypeName(): string {
		return 'Scene';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		// Serialize children
		if (this.children.size) {
			json.children = [...this.children];
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		// Unserialize children
		this.children.clear();
		if (json.children) {
			for (const childId of json.children as string[]) {
				const child = context.elements.get(childId) as SfmNode | undefined; // TODO: check if it's actually a track group

				if (child) {
					this.children.add(child);
				}
			}
		}
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
			case 'children':
				return [...this.children];
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmScene);
