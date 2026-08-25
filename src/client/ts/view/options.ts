import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { createElement } from 'harmony-ui';
import optionsCSS from '../../css/options.css';
import { Controller } from '../controller';
import { Panel } from './panel';

export class OptionsPanel extends Panel {
	#htmlLanguageSelector?: HTMLSelectElement;

	constructor() {
		super();
		Controller.addEventListener('useropenoptions', () => this.getPanel().activate());
	}

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: optionsCSS, titleI18n: '#options', layout: 'column' });


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

		OptionsManagerEvents.addEventListener('app.lang', (event: Event) => this.#htmlLanguageSelector!.value = (event as CustomEvent<OptionsManagerEvent<string>>).detail.value as string);

		this.#initLanguages();
	}


	#initLanguages(): void {
		const currentlang = OptionsManager.getItem('app.lang');
		const langs: Record<string, string> = {
			'english': 'English',
			'french': 'Français',
			/*
			'german': 'Deutsch',
			'italian': 'Italiano',
			'korean': '한국어',
			'spanish': 'Español',
			'schinese': '简体中文',
			'tchinese': '繁體中文',
			'russian': 'Русский',
			'thai': 'ไทย',
			'japanese': '日本語',
			'portuguese': 'Português',
			'polish': 'Polski',
			'danish': 'Dansk',
			'dutch': 'Nederlands',
			'finnish': 'Suomi',
			'norwegian': 'Norsk',
			'swedish': 'Svenska',
			'hungarian': 'Magyar',
			'czech': 'čeština',
			'romanian': 'Română',
			'turkish': 'Türkçe',
			'brazilian': 'Português-Brasil',
			'bulgarian': 'български',
			'greek': 'Ελληνικά',
			'ukrainian': 'Українська'
			*/
		};

		const arr = Object.keys(langs);
		let langName;
		while (langName = arr.shift()) {
			const langCaption = langs[langName];

			const option = createElement('option', { value: langName, innerText: langCaption }) as HTMLOptionElement;
			this.#htmlLanguageSelector?.appendChild(option);
			if (currentlang == langName) {
				option.selected = true;
			}
		}
	}
}
