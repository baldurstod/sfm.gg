
export interface Undoable {
	do(command: Command): boolean;
	undo(command: Command): boolean;
}

/**
 * A single command. Multiple commands part of the same action can be undone at once.
 */
export class Command {
	readonly element: Undoable;
	readonly command: string;
	readonly params: any/*TODO: improve type*/;
	undoParams: any/*TODO: improve type*/;

	constructor(element: Undoable, command: string, params: any) {
		this.element = element;
		this.command = command;
		this.params = params;
	}

	undo(): boolean {
		return this.element.undo(this);
	}
}

/**
 * An action is an operation or a list of operation that will be undone all at once
 */
export class Action {
	#operations: Command[] = [];
	#committed = false;

	do(element: Undoable, command: string, params: any): boolean {
		const operation = new Command(element, command, params);
		const result = element.do(operation);
		if (!result) {
			return false;
		}

		this.#operations.push(operation);
		return true;
	}

	undo(): boolean {
		let operation: Command | undefined;
		while (operation = this.#operations.pop()) {
			if (!operation.undo()) {
				return false;
			}
		}
		return true;
	}

	commit(): void {
		this.#committed = true;
	}

	isCommitted(): boolean {
		return this.#committed;
	}

	hasOperations(): boolean {
		return this.#operations.length > 0;
	}
}
