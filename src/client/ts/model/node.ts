import { Command } from '../history/action';
import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyValue, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmFilmClip } from './clips/filmclip';
import { SfmEntity } from './entity';

type AddChildUndo = {
	child: SfmNode;
	childs: Set<SfmNode>;
	formerParent?: SfmNode;
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
	#clip?: SfmFilmClip | null;

	constructor(params: NodeParameters<T> = {}) {
		super(params);

		if (params.entity) {
			this.#entity = params.entity;
		}
	}

	getEntity(): T | undefined {
		return this.#entity;
	}

	getParentNode(): SfmNode | undefined {
		return this.#parent;
	}

	getChildren(): Set<SfmNode> {
		return new Set<SfmNode>(this.#children);
	}

	#addChild(child: SfmNode): void {
		this.#children.add(child);
		child.#parent = this;
	}

	#deleteChild(child: SfmNode): void {
		this.#children.delete(child);
		child.#parent = undefined;
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'add-child':
				const addedChild = command.params as SfmNode;// TODO: check if its an SfmNode
				command.undoParams = {
					childs: new Set(this.#children),
					child: command.params as SfmNode,
					formerParent: addedChild.#parent,
				} as AddChildUndo;

				if (addedChild.#parent) {
					addedChild.#parent.#deleteChild(addedChild);
				}
				this.#addChild(command.params as SfmNode);
				return true;
			case 'delete-child':
				command.undoParams = {
					childs: new Set(this.#children),
				};
				this.#deleteChild(command.params as SfmNode);// TODO: check if its an SfmNode
				return true;
			case 'delete-children':
				command.undoParams = {
					childs: new Set(this.#children),
				};
				this.#children.clear();
				return true;
			case 'set-entity':
				command.undoParams = this.#entity;
				this.#entity = command.params as T;// TODO: check if its an SfmEntity
				return true;
			case 'set-parent-clip':
				command.undoParams = this.#clip;
				this.#clip = command.params as SfmFilmClip;// TODO: check if its an SfmFilmClip
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
				const addedChild = (command.undoParams as AddChildUndo).child;
				(command.undoParams as AddChildUndo).childs.forEach(child => this.#addChild(child));
				//addedChild.#parent = (command.undoParams as AddChildUndo).formerParent;
				const formerParent = (command.undoParams as AddChildUndo).formerParent;
				if (formerParent) {
					formerParent.#addChild(addedChild);
				}
				return true;
			case 'delete-child':
			case 'delete-children':
				this.#children.clear();
				(command.undoParams as AddChildUndo).childs.forEach(child => this.#addChild(child));
				return true;
			case 'set-entity':
				this.#entity = command.undoParams as T | undefined;
				return true;
			case 'set-parent-clip':
				this.#clip = command.undoParams as SfmFilmClip;
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
			this.#entity = context.elements.get(json.entity as string) as T; // TODO: check if it's actually an entity
		}

		// Unserialize children
		this.#children.clear();
		if (json.children) {
			for (const childId of json.children as string[]) {
				const child = context.elements.get(childId) as SfmNode | undefined; // TODO: check if it's actually a track group

				if (child) {
					this.#addChild(child);
				}
			}
		}
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'entity',
				i18n: '#entity',
				type: 'element',
				settable: true,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyValue {
		switch (name) {
			case 'entity':
				return this.#entity;
			default:
				throw new Error("do me " + name);
		}
	}

	getParent(): Serializable | null {
		return this.#clip ?? this.#parent ?? null;
	}
}

SfmSerializer.registerSerializable(SfmNode);

//new SfmNode().do(new Command(new Action(), new SfmNode(), 'add-child', new SfmNode()));
//const node = new SfmNode();
//const action = History.startAction();
//action.do(node, 'add-child', node);
