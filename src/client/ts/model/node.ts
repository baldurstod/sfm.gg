import { Command } from '../history/action';
import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmEntity } from './entity';

type AddChildUndo = {
	child: SfmNode;
	childs: Set<SfmNode>;
	parent?: SfmNode;
}

export interface NodeParameters<T extends SfmEntity = SfmEntity> extends SerializableParameters {
	entity?: T;
}

/**
 * An element of the scene hierarchy. It hold a linked entity and children nodes
 */
export class SfmNode<T extends SfmEntity = SfmEntity> extends Serializable {
	readonly isSfmNode = true as const;
	#entity?: T;
	#parent?: SfmNode;
	#children = new Set<SfmNode>();

	constructor(params: NodeParameters<T> = {}) {
		super(params);

		if (params.entity) {
			this.#entity = params.entity;
		}
	}

	getEntity(): T | undefined {
		return this.#entity;
	}

	getParent(): SfmNode | undefined {
		return this.#parent;
	}

	getChildren(): Set<SfmNode> {
		return new Set<SfmNode>(this.#children);
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'add-child':
				command.undoParams = {
					childs: new Set(this.#children),
					child: command.params as SfmNode,
					parent: (command.params as SfmNode).#parent,
				};
				this.#children.add(command.params);// TODO: check if its an SfmNode
				(command.params as SfmNode).#parent = this;
				return true;
			case 'set-entity':
				command.undoParams = this.#entity;
				this.#entity = command.params;// TODO: check if its an SfmEntity
				return true;
			/*
			case 'set-parent':
				command.undoParams = this.#parent;
				this.#parent = command.params;// TODO: check if its an SfmNode
				return true;
			*/
			default:
				return super.do(command);
		}
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'add-child':
				this.#children.clear();
				(command.undoParams as AddChildUndo).childs.forEach(child => this.#children.add(child));
				(command.undoParams as AddChildUndo).child.#parent = (command.undoParams as AddChildUndo).parent;
				return true;
			case 'set-entity':
				this.#entity = command.undoParams;
				return true;
			default:
				return super.undo(command);
		}
	}

	static override getTypeName(): string {
		return 'Node';
	}

	override getDefaultName(): string {
		return 'Node';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#entity) {
			json.entity = this.#entity;
		}

		// Serialize children
		if (this.#children.size) {
			json.children = [...this.#children];
		}


		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		if (json.entity) {
			this.#entity = context.elements.get(json.entity as string) as any; // TODO: check if it's actually an entity
		}

		// Unserialize children
		this.#children.clear();
		if (json.children) {
			for (const childId of json.children as string[]) {
				const child = context.elements.get(childId) as SfmNode | undefined; // TODO: check if it's actually a track group

				if (child) {
					this.#children.add(child);
				}
			}
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
				return this.#entity;
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmNode);

//new SfmNode().do(new Command(new Action(), new SfmNode(), 'add-child', new SfmNode()));
//const node = new SfmNode();
//const action = History.startAction();
//action.do(node, 'add-child', node);
