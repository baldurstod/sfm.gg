import { HarmonyTree, ItemClickEventData, TreeItem } from 'harmony-ui';
import elementViewerCSS from '../../css/elementviewer.css';
import { Controller } from '../controller';
import { Serializable } from '../serialize/serializable';
import { Panel } from './panel';

export class ElementViewerPanel extends Panel {
	#rootElement: Serializable | null = null;
	#htmlTree?: HarmonyTree;
	#treeRoot?: TreeItem;
	#treeItems = new WeakMap<Serializable, TreeItem>();
	#treeItemsReverse = new WeakMap<TreeItem, Serializable>();
	//treeRoot = new TreeItem('', { childs: [] });

	constructor() {
		super()
		Controller.addEventListener('viewelement', (event) => this.setRootElement(event.detail));
	}

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: elementViewerCSS, layout: 'column', titleI18n: '#element_viewer', dropTarget: true, });

		this.#htmlTree = new HarmonyTree();
		this.#htmlTree.addEventListener('itemclick', (event: Event) => {
			const item = (event as CustomEvent<ItemClickEventData>).detail.item;

			if (!this!.#htmlTree!.isExpanded(item)) {
				this.#expandItem(item)
			}
		});
		this.panel!.append(this.#htmlTree.htmlElement);
	}

	setRootElement(element: Serializable | null): void {
		this.#rootElement = element;

		this.#treeRoot = this.#getTreeItem(element, '') //?? new TreeItem('', { childs: [] });
		this.#htmlTree?.setRoot(this.#treeRoot);

		this.refreshHTML();
		this.#expandItem(this.#treeRoot);
	}

	#getTreeItem(element: Serializable | null, prefix: string): TreeItem {
		if (element === null) {
			return new TreeItem('', { childs: [] });
		}
		let item = this.#treeItems.get(element);
		const name = prefix + (element.constructor as typeof Serializable).getTypeName() + element.getName();
		if (!item) {
			item = new TreeItem(name, { childs: [] });
		} else {
			item.name = name;
		}

		this.#treeItems.set(element, item);
		this.#treeItemsReverse.set(item, element);

		return item;
	}

	protected refreshHTML(): void {
		this.initPanel();

		//this.panel!.getContent().replaceChildren();

		/*
		if (!this.#rootElement) {
			return;
		}

		const html = createElement('div', {
			parent: this.panel!.getContent(),
			childs: [
				createElement('div', { innerText: this.#rootElement.getName() }),
			]
		});
		*/
		/*
				const properties = this.#rootElement.getProperties();
				for (const property of properties) {
					const value = this.#rootElement.getProperty(property.name);

					if (value instanceof Serializable) {

						createElement('div', {
							parent: html,
							childs: [
								createElement('span', { i18n: property.i18n }),
								createElement('span', { innerText: (value.constructor as typeof Serializable).getTypeName() }),
							],
						});
					} else {
						createElement('div', {
							parent: html,
							childs: [
								createElement('span', { i18n: property.i18n }),
								createElement('span', { innerText: String(value) }),
							],
						});
					}
				}
					*/
	}

	#expandItem(item: TreeItem): void {
		const serializable = this.#treeItemsReverse.get(item);
		if (!serializable) {
			return;
		}

		if (!serializable) {
			return;
		}

		const childs = item.childs;
		childs.clear();
		const properties = serializable.getProperties();
		for (const property of properties) {
			const value = serializable.getProperty(property.name);

			if (value instanceof Serializable) {

				const item = this.#getTreeItem(value, property.name);
				childs.add(item);

				/*
				createElement('div', {
					parent: html,
					childs: [
						createElement('span', { i18n: property.i18n }),
						createElement('span', { innerText: (value.constructor as typeof Serializable).getTypeName() }),
					],
				});
				*/
			} else if (Array.isArray(value)) {
				const itemArray = new TreeItem(property.name);//this.#getTreeItem(value, property.name);
				childs.add(itemArray);

				for (const v of value) {

					if (v instanceof Serializable) {

						const item = this.#getTreeItem(v, property.name);
						itemArray.childs.add(item);
					} else {
						const item = new TreeItem(property.name);//this.#getTreeItem(value, property.name);
						childs.add(item);

					}


					//string

				}
			} else {
				const item = new TreeItem(property.name);//this.#getTreeItem(value, property.name);
				childs.add(item);

				/*
				createElement('div', {
					parent: html,
					childs: [
						createElement('span', { i18n: property.i18n }),
						createElement('span', { innerText: String(value) }),
					],
				});
				*/
			}
		}


		//this.#htmlTree?.setRoot(this.#treeRoot);
		this.#htmlTree?.refreshItem(item);

		/*
		if (this!.#htmlTree!.isExpanded(item)) {
			this.#htmlTree?.expandItem(item);
		}
		*/
	}
}

/*

export class ElementViewerPanel extends Panel {
	#rootElement: Serializable | null = null;

	constructor() {
		super()
		Controller.addEventListener('viewelement', (event) => this.setRootElement(event.detail));
	}

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: elementViewerCSS, layout: 'column', titleI18n: '#element_viewer', dropTarget: true, });
	}

	setRootElement(element: Serializable | null): void {
		this.#rootElement = element;
		this.refreshHTML();
	}

	protected refreshHTML(): void {
		this.initPanel();

		this.panel!.getContent().replaceChildren();

		if (!this.#rootElement) {
			return;
		}

		const html = createElement('div', {
			parent: this.panel!.getContent(),
			childs: [
				createElement('div', { innerText: this.#rootElement.getName() }),
			]
		});

		const properties = this.#rootElement.getProperties();
		for (const property of properties) {
			const value = this.#rootElement.getProperty(property.name);

			if (value instanceof Serializable) {

				createElement('div', {
					parent: html,
					childs: [
						createElement('span', { i18n: property.i18n }),
						createElement('span', { innerText: (value.constructor as typeof Serializable).getTypeName() }),
					],
				});
			} else {
				createElement('div', {
					parent: html,
					childs: [
						createElement('span', { i18n: property.i18n }),
						createElement('span', { innerText: String(value) }),
					],
				});
			}
		}
	}
}

*/
