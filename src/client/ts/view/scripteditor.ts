import { ScriptEditor } from 'harmony-3d-utils';
import { Panel } from './panel';

export class ScriptEditorPanel extends Panel {
	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, layout: 'column', titleI18n: '#script_editor', });
		//this.panel!.append(new SceneExplorer().htmlElement);

		const scriptEditor = new ScriptEditor();

		this.panel!.append(scriptEditor.htmlElement);

		scriptEditor.initEditor({ aceUrl: './assets/js/ace-builds/src-min/ace.js' });
	}
}
