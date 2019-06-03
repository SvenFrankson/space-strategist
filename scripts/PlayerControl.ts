class PlayerControl {

    private _selectedElementPanel: SpacePanel;
    private _selectedElement: Selectionable;
    private get selectedElement(): Selectionable {
        return this._selectedElement;
    }
    private set selectedElement(selectionable: Selectionable) {
        if (selectionable === this.selectedElement) {
            return;
        }
        if (this._selectedElementPanel) {
            this._selectedElementPanel.dispose();
            this._selectedElementPanel = undefined;
        }
        if (this.selectedElement) {
            this.selectedElement.onUnselected();
        }
        this._selectedElement = selectionable;
        if (this.selectedElement) {
            this.selectedElement.onSelected();
        }
    }

    private _zero: BABYLON.Mesh;

    constructor(
        public scene: BABYLON.Scene
    ) {
        this._zero = BABYLON.MeshBuilder.CreateGround("zero", { width: 100, height: 100}, scene);
        this._zero.isVisible = false;
        this._zero.isPickable = true;
        this.enable();
    }

    public enable() {
        this._selectedElement = undefined;
        Main.Canvas.addEventListener("pointerdown", this.pointerDown);
        Main.Canvas.addEventListener("pointermove", this.pointerMove);
        Main.Canvas.addEventListener("pointerup", this.pointerUp);
    }

    public disable(): void {
        this._selectedElement = undefined;
        Main.Canvas.removeEventListener("pointerdown", this.pointerDown);
        Main.Canvas.removeEventListener("pointermove", this.pointerMove);
        Main.Canvas.removeEventListener("pointerup", this.pointerUp);
    }

    private _pointerDownX: number = 0;
    private _pointerDownY: number = 0;
    private pointerDown = () => {
        this._pointerDownX = this.scene.pointerX;
        this._pointerDownY = this.scene.pointerY;
    }

    private pointerMove = () => {
        
    }

    private pointerUp = (ev: PointerEvent) => {
        if (Math.abs(this.scene.pointerX - this._pointerDownX) < 3 && Math.abs(this.scene.pointerY - this._pointerDownY) < 3) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m instanceof Selectionable || m === this._zero;
                }
            );
            if (pick.hit) {
                if (pick.pickedMesh instanceof Selectionable) {
                    if (ev.button === 0) {
                        this.selectedElement = pick.pickedMesh;
                        return;
                    }
                    else if (ev.button === 2) {
                        if (this.selectedElement) {
                            this.selectedElement.onLeftClick(undefined, pick.pickedMesh);
                        }
                        return;
                    }
                }
                if (pick.pickedMesh === this._zero) {
                    if (ev.button === 2) {
                        if (this.selectedElement) {
                            this.selectedElement.onLeftClick(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), undefined);
                        }
                        return;
                    }
                }
            }
            this.selectedElement = undefined;
        }
    }
}