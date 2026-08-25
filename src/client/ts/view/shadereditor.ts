import { Panel } from './panel';

export class ShaderEditorPanel extends Panel {
	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, layout: 'column', titleI18n: '#shader_editor', });
		//this.panel!.append(new SceneExplorer().htmlElement);

		this.panel!.append('shader editor');
	}
}
