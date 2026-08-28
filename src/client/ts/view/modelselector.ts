import { Panel } from './panel';

export class ModelSelectorPanel extends Panel {

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 3, layout: 'column', floating: true, titleI18n: '#model_selector', });

		this.panel!.append('this is the model selector');


		/*
		createElement('label', {
			parent: this.panel!.getContent(),
			childs: [
				createElement('span', { i18n: '#language', }),
				this.#htmlLanguageSelector = createElement('select', {
					class: 'language-selector',
					$input: () => OptionsManager.setItem('app.lang', this.#htmlLanguageSelector!.value),
				}) as HTMLSelectElement,
			]
		});
		*/
	}

	open() {
		this.initPanel();
	}
}
