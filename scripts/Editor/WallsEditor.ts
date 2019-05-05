class WallsEditor {

    private _dragedWallNode: WallNode;
    private _selectedWallNodePanel: SpacePanel;
    private _selectedWallElement: Selectionable;
    private get selectedWallElement(): Selectionable {
        return this._selectedWallElement;
    }
    private set selectedWallElement(selectionable: Selectionable) {
        if (selectionable === this.selectedWallElement) {
            return;
        }
        if (this._selectedWallNodePanel) {
            this._selectedWallNodePanel.dispose();
            this._selectedWallNodePanel = undefined;
        }
        this._selectedWallElement = selectionable;
        if (this.selectedWallElement) {
            if (this.selectedWallElement instanceof WallNode) {
                this._selectedWallNodePanel = WallNodeEditor.CreatePanel(
                    this.selectedWallElement,
                    () => {
                        this.selectedWallElement = undefined;
                    }
                );
            }
            if (this.selectedWallElement instanceof Wall) {
                this._selectedWallNodePanel = WallEditor.CreatePanel(
                    this.selectedWallElement,
                    () => {
                        this.selectedWallElement = undefined;
                    }
                );
            }
        }
    }
    private ground: BABYLON.Mesh;

    constructor(
        public wallSystem: WallSystem,
        public scene: BABYLON.Scene
    ) {
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 40, height: 40}, scene);
        this.enable();
    }

    public enable() {
        this.ground.isVisible = true;
        document.getElementById("add-wall").addEventListener("click", this.createNode);
        this.addEventListenerDrag();
    }

    public disable() {
        this.ground.isVisible = false;
        document.getElementById("add-wall").removeEventListener("click", this.createNode);
    }

    private createNode = () => {
        this.removeEventListenerDrag();
        Main.Canvas.addEventListener("pointerup", this.pointerUpFirst);
    }

    private addEventListenerDrag(): void {
        this._selectedWallElement = undefined;
        Main.Canvas.addEventListener("pointerdown", this.pointerDown);
        Main.Canvas.addEventListener("pointermove", this.pointerMoveOnDrag);
        Main.Canvas.addEventListener("pointerup", this.pointerUp);
    }

    private removeEventListenerDrag(): void {
        Main.Canvas.removeEventListener("pointerdown", this.pointerDown);
        Main.Canvas.removeEventListener("pointermove", this.pointerMoveOnDrag);
        Main.Canvas.removeEventListener("pointerup", this.pointerUp);
    }

    private _pointerDownX: number = 0;
    private _pointerDownY: number = 0;
    private pointerDown = () => {
        this._pointerDownX = this.scene.pointerX;
        this._pointerDownY = this.scene.pointerY;
        let pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => {
                return m instanceof WallNode;
            }
        );
        if (pick.hit && pick.pickedMesh instanceof WallNode) {
            if (this.selectedWallElement === pick.pickedMesh) {
                this._dragedWallNode = pick.pickedMesh as WallNode;
                this.scene.activeCamera.detachControl(Main.Canvas);
            }
        }
    }

    private pointerMoveOnDrag = () => {
        if (this._dragedWallNode) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m === this.ground;
                }
            );
            if (pick.hit) {
                this._dragedWallNode.position2D.x = pick.pickedPoint.x;
                this._dragedWallNode.position2D.y = pick.pickedPoint.z;
                this.wallSystem.instantiate();
            }
        }
    }

    private pointerUp = () => {
        this._dragedWallNode = undefined;
        if (Math.abs(this.scene.pointerX - this._pointerDownX) < 3 && Math.abs(this.scene.pointerY - this._pointerDownY) < 3) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m instanceof Selectionable;
                }
            );
            if (pick.hit && pick.pickedMesh instanceof Selectionable) {
                this.selectedWallElement = pick.pickedMesh;
            }
            else {
                this.selectedWallElement = undefined;
            }
        }
        this.scene.activeCamera.attachControl(Main.Canvas);
    }

    private pointerUpFirst = () => {
        let pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => {
                return m === this.ground;
            }
        );
        if (pick.hit) {
            for (let i = 0; i < this.wallSystem.nodes.length; i++) {
                if (BABYLON.Vector3.DistanceSquared(this.wallSystem.nodes[i].position, pick.pickedPoint) < 1) {
                    this._selectedWallElement = this.wallSystem.nodes[i];
                    break;
                }
            }
            if (!this._selectedWallElement) {
                this._selectedWallElement = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), this.wallSystem);
            }
            Main.Canvas.removeEventListener("pointerup", this.pointerUpFirst);
            Main.Canvas.addEventListener("pointerup", this.pointerUpSecond);
        }
    }

    private pointerUpSecond = () => {
        let pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => {
                return m === this.ground;
            }
        );
        if (pick.hit) {
            let otherNode: WallNode;
            for (let i = 0; i < this.wallSystem.nodes.length; i++) {
                if (BABYLON.Vector3.DistanceSquared(this.wallSystem.nodes[i].position, pick.pickedPoint) < 1) {
                    otherNode = this.wallSystem.nodes[i];
                }
            }
            if (!otherNode) {
                otherNode = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), this.wallSystem);
            }
            if (this._selectedWallElement instanceof WallNode && otherNode && (this._selectedWallElement !== otherNode)) {
                this.wallSystem.walls.push(new Wall(this._selectedWallElement, otherNode));
            }
            Main.Canvas.removeEventListener("pointerup", this.pointerUpSecond);
            this.addEventListenerDrag();
            this.wallSystem.instantiate();
        }
    }
}