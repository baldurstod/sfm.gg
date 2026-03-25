import { I18n } from 'harmony-ui';
import english from '../json/i18n/english.json';
import french from '../json/i18n/french.json';

class Application {

	static {
		I18n.setOptions({ translations: [english, french] });
		I18n.start();
		this.#initListeners();
		this.#initHTML();
		this.#initOptions();
	}

	static #initListeners() {
	}

	static #initHTML() {
	}

	static #initOptions() {
	}
}
