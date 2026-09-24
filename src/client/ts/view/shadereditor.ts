import { ShaderEditor } from 'harmony-3d';
import { Panel } from './panel';

export class ShaderEditorPanel extends Panel {
	#shaderEditor = new ShaderEditor();
	#initialized = false;

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, layout: 'column', titleI18n: '#shader_editor', });
	}

	override activated(): void {
		if (this.#initialized) {
			return;
		}
		this.initPanel();
		this.#shaderEditor.initEditor({ aceUrl: './assets/js/ace-builds/src-min/ace.js', displayCustomShaderButtons: true });
		this.panel!.append(this.#shaderEditor);
		this.#initialized = true;
	};
}
