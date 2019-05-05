interface IMeshWithGroundWidth {
    groundWidth: number;
    height: number;
}

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
        if (this._target) {
            this._target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        }
        if (this._line) {
            this._line.dispose();
        }
        document.body.removeChild(this);
    }

    private _line: BABYLON.LinesMesh;
    private _target: BABYLON.Mesh & IMeshWithGroundWidth;
    public setTarget(mesh: BABYLON.Mesh & IMeshWithGroundWidth): void {
        this._target = mesh;
        this._line = BABYLON.MeshBuilder.CreateLines(
            "line",
            {
                points: [
                    BABYLON.Vector3.Zero(),
                    BABYLON.Vector3.Zero()
                ],
                updatable: true,
                colors: [
                    new BABYLON.Color4(0, 1, 0, 1),
                    new BABYLON.Color4(0, 1, 0, 1)
                ]
            },
            this._target.getScene(),
        );
        this._line.renderingGroupId = 1;
        this._target.getScene().onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        let dView = this._target.position.subtract(this._target.getScene().activeCamera.position);
        let n = BABYLON.Vector3.Cross(dView, new BABYLON.Vector3(0, 1, 0));
        n.normalize();
        n.scaleInPlace(- this._target.groundWidth * 0.5);
        let p0 = this._target.position;
        let p1 = this._target.position.add(n);
        let p2 = p1.clone();
        p2.y += this._target.groundWidth * 0.5 + this._target.height;
        let screenPos = BABYLON.Vector3.Project(
            p2,
            BABYLON.Matrix.Identity(),
            this._target.getScene().getTransformMatrix(),
            this._target.getScene().activeCamera.viewport.toGlobal(1, 1)
        )
        this.style.left = (screenPos.x * Main.Canvas.width - this.clientWidth * 0.5) + "px";
        this.style.bottom = ((1 - screenPos.y) * Main.Canvas.height) + "px";
        this._line.setVerticesData(
            BABYLON.VertexBuffer.PositionKind,
            [...p0.asArray(), ...p2.asArray()]
        );
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

    public addMediumButtons(value1: string, onClickCallback1: () => void, value2?: string, onClickCallback2?: () => void): HTMLInputElement[] {
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
        let inputs = [inputElement1];
        if (value2 && onClickCallback2) {
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
            inputs.push(inputElement2);
        }
        this._innerBorder.appendChild(lineElement);
        return inputs;
    }
}

window.customElements.define("space-panel", SpacePanel);

class SpacePanelLabel extends HTMLElement {

    constructor() {
        super();
    }
}

window.customElements.define("space-panel-label", SpacePanelLabel);