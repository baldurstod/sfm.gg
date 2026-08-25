import { AdvancedOptionsPanel } from './advancedoptions';
import { OptionsPanel } from './options';
import { Panel } from './panel';
import { ScriptEditorPanel } from './scripteditor';
import { ShaderEditorPanel } from './shadereditor';
import { Viewports } from './viewports';

export class EditorPanel extends Panel {
	#viewports = new Viewports();
	#scriptEditor = new ScriptEditorPanel();
	#shaderEditor = new ShaderEditorPanel();
	#options = new OptionsPanel();
	#advancedOptions = new AdvancedOptionsPanel();

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 3, layout: 'tabs', dropTarget: true, });
		this.panel!.append(
			this.#viewports.getPanel(),
			this.#scriptEditor.getPanel(),
			this.#shaderEditor.getPanel(),
			this.#options.getPanel(),
			this.#advancedOptions.getPanel(),
		);
	}
}
