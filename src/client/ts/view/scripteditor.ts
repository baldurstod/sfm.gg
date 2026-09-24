import { ScriptEditor } from 'harmony-3d-utils';
import { Panel } from './panel';

export class ScriptEditorPanel extends Panel {
	#scriptEditor?: ScriptEditor;
	#initialized = false;

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, layout: 'column', titleI18n: '#script_editor', });
	}

	override activated(): void {
		if (this.#initialized) {
			return;
		}
		this.initPanel();
		this.#scriptEditor = new ScriptEditor();
		this.#scriptEditor.initEditor({ aceUrl: './assets/js/ace-builds/src-min/ace.js' });
		this.panel!.append(this.#scriptEditor.htmlElement);
		this.#initialized = true;
	};
}
