class SpacePanel extends HTMLElement {

    private _innerBorder: HTMLDivElement;

    public static CreateSpacePanel(): SpacePanel {
        let panel = document.createElement("space-panel") as SpacePanel;
        document.body.appendChild(panel);
        return panel;
    }

    constructor() {
        super();
    }

    public connectedCallback(): void {
       this._innerBorder = document.createElement("div");
       this._innerBorder.classList.add("space-panel-inner-border");
       this.appendChild(this._innerBorder);
    }

    public dispose(): void {
        document.body.removeChild(this);
    }

    public addTitle1(title: string): void {
        let e = document.createElement("h1");
        e.classList.add("space-title-1");
        e.textContent = title;
        this._innerBorder.appendChild(e);
    }

    public addTitle2(title: string): void {
        let e = document.createElement("h2");
        e.classList.add("space-title-2");
        e.textContent = title;
        this._innerBorder.appendChild(e);
    }

    public addNumberInput(label: string, value: number, onInputCallback: (v: number) => void, precision: number = 2): HTMLInputElement {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-number");
        inputElement.setAttribute("type", "number");
        inputElement.value = value.toFixed(precision);
        inputElement.addEventListener(
            "input",
            (ev) => {
                if (ev.srcElement instanceof HTMLInputElement) {
                    let v = parseFloat(ev.srcElement.value);
                    if (isFinite(v)) {
                        if (onInputCallback) {
                            onInputCallback(v);
                        }
                    }
                }
            }
        );
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        return inputElement;
    }

    public addTextInput(label: string, text: string, onInputCallback: (t: string) => void): HTMLInputElement {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-text");
        inputElement.setAttribute("type", "text");
        inputElement.value = text;
        inputElement.addEventListener(
            "input",
            (ev) => {
                if (ev.srcElement instanceof HTMLInputElement) {
                    onInputCallback(ev.srcElement.value);
                }
            }
        );
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        return inputElement;
    }

    public addMediumButtons(value1: string, onClickCallback1: () => void, value2: string, onClickCallback2: () => void): HTMLInputElement[] {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement1 = document.createElement("input");
        inputElement1.classList.add("space-button");
        inputElement1.setAttribute("type", "button");
        inputElement1.value = value1;
        inputElement1.addEventListener(
            "click",
            () => {
                onClickCallback1();
            }
        );
        lineElement.appendChild(inputElement1);
        let inputElement2 = document.createElement("input");
        inputElement2.classList.add("space-button");
        inputElement2.setAttribute("type", "button");
        inputElement2.value = value2;
        inputElement2.addEventListener(
            "click",
            () => {
                onClickCallback2();
            }
        );
        lineElement.appendChild(inputElement2);
        this._innerBorder.appendChild(lineElement);
        return [inputElement1, inputElement2];
    }
}

window.customElements.define("space-panel", SpacePanel);

class SpacePanelLabel extends HTMLElement {

    constructor() {
        super();
    }
}

window.customElements.define("space-panel-label", SpacePanelLabel);