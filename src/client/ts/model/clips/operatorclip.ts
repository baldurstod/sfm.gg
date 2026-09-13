import { Command } from '../../history/action';
import { SerializableProperty, SerializablePropertyType, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';
import { SfmOperatorContext } from '../interfaces/operator';
import { SfmOperator } from '../operators/operator';
import { ClipParameters, SfmClip, SfmClipType } from './clip';

export interface OperatorClipParameters extends ClipParameters {
}

export class SfmOperatorClip extends SfmClip {
	readonly isSfmOperatorClip = true as const;
	readonly #operators = new Set<SfmOperator>();
	type: SfmClipType = 'operator' as const;

	getOperators(): Set<SfmOperator> {
		return new Set(this.#operators);
	}

	getClipType(): SfmClipType {
		return 'operator';
	}

	createClip(name: string): SfmClip {
		return new SfmOperatorClip({ name });
	}

	override update(context: SfmOperatorContext): void {
		for (const operator of this.#operators) {
			operator.operate(context);
		}
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'add-operator':
				command.undoParams = new Set<SfmOperator>(this.#operators);
				this.#operators.add(command.params);//TODO: check if it's actually an operator
				return true;
			default:
				return super.do(command);
		}
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'add-operator':
				this.#operators.clear();
				(command.undoParams as Set<SfmOperator>).forEach(channel => this.#operators.add(channel));
				return true;
			default:
				return super.undo(command);
		}
	}

	static override getTypeName(): string {
		return 'OperatorClip';
	}

	override getDefaultName(): string {
		return 'Operator clip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#operators.size) {
			json.operators = [...this.#operators];
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.#operators.clear();
		if (json.operators) {
			for (const operatorId of json.operators as string[]) {
				const operator = context.elements.get(operatorId) as SfmOperator | undefined; // TODO: check if it's actually an operator

				if (operator) {
					this.#operators.add(operator);
				}
			}
		}
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'operators',
				i18n: '#operators',
				//type: typeof nodeArray,
				settable: false,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			case 'operators':
				return [...this.#operators];
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmOperatorClip);
