function applyElementInfo(element, info) {
	if (typeof info === "string") {
		element.className = info;
		return;
	}
	if (!info) return;

	if (info.cls) element.className = Array.isArray(info.cls) ? info.cls.join(" ") : info.cls;
	if (info.text !== undefined) element.textContent = info.text;
	if (info.type !== undefined) element.type = info.type;
	if (info.placeholder !== undefined) element.placeholder = info.placeholder;
	if (info.href !== undefined) element.href = info.href;
	if (info.value !== undefined) element.value = info.value;
	for (const [name, value] of Object.entries(info.attr ?? {})) {
		if (value !== null) element.setAttribute(name, String(value));
	}
}

Node.prototype.createEl = function (tag, info, callback) {
	const element = document.createElement(tag);
	applyElementInfo(element, info);
	this.appendChild(element);
	if (callback) callback(element);
	return element;
};

Node.prototype.createDiv = function (info, callback) {
	return this.createEl("div", info, callback);
};

Node.prototype.createSpan = function (info, callback) {
	return this.createEl("span", info, callback);
};

Node.prototype.instanceOf = function (type) {
	return this instanceof type;
};

HTMLElement.prototype.empty = function () {
	this.replaceChildren();
};

HTMLElement.prototype.setText = function (text) {
	this.textContent = text;
};

HTMLElement.prototype.addClass = function (...classes) {
	this.classList.add(...classes);
};

HTMLElement.prototype.removeClass = function (...classes) {
	this.classList.remove(...classes);
};

global.createEl = (tag, info, callback) => document.createDocumentFragment().createEl(tag, info, callback);
global.createDiv = (info, callback) => document.createDocumentFragment().createDiv(info, callback);
global.createSpan = (info, callback) => document.createDocumentFragment().createSpan(info, callback);
global.activeDocument = document;
