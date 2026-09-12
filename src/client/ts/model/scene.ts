import { Scene } from 'harmony-3d';
import { Command } from '../history/action';
import { SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmEntity } from './entity';
import { SfmNode } from './node';
import { SfmWorld } from './world';

export class SfmScene extends SfmEntity {
	readonly isSfmScene = true as const;
	#scene = new Scene();
	#world?: SfmWorld;

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

	do(command: Command): boolean {
		switch (command.command) {
			case 'set-world':
				command.undoParams = this.#world;
				this.#world = command.params;
				return true;
			default:
				return super.do(command);
		}
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'set-world':
				this.#world = command.undoParams;
				return true;
			default:
				return super.undo(command);
		}
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
}

SfmSerializer.registerSerializable(SfmScene);
