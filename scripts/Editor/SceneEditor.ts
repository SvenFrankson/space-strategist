class SceneEditor {

    private _newProp: Prop;
    private _draggedElement: Draggable;
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
        this._selectedElement = selectionable;
        if (this.selectedElement) {
            if (this.selectedElement instanceof WallNode) {
                this._selectedElementPanel = WallNodeEditor.CreatePanel(
                    this.selectedElement,
                    () => {
                        this.selectedElement = undefined;
                    }
                );
            }
            else if (this.selectedElement instanceof Wall) {
                this._selectedElementPanel = WallEditor.CreatePanel(
                    this.selectedElement,
                    () => {
                        this.selectedElement = undefined;
                    }
                );
            }
            else if (this.selectedElement instanceof Prop) {
                this._selectedElementPanel = PropEditor.CreatePanel(
                    this.selectedElement,
                    () => {
                        this.selectedElement = undefined;
                    },
                    (prop) => {
                        this.selectedElement = undefined;
                        this._newProp = prop;
                        this._newProp.instantiate();
                    }
                );
            }
        }
    }

    private _panel: SpacePanel;
    private _zero: BABYLON.Mesh;

    constructor(
        public wallSystem: WallSystem,
        public owner: Player,
        public scene: BABYLON.Scene
    ) {
        this._zero = BABYLON.MeshBuilder.CreateGround("zero", { width: 100, height: 100}, scene);
        this._zero.isVisible = false;
        this._zero.isPickable = true;
        this.enable();
    }

    public enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.addTitle1("EDITOR");
        this._panel.addTitle2("PROPS");
        this._panel.addLargeButton("CONTAINER", this.createContainer);
        this._panel.addLargeButton("TANK", this.createTank);
        this._panel.addLargeButton("TURRET", this.createTurret);
        this._panel.addLargeButton("LANDING PAD", this.createLandingPad);
        this._panel.addLargeButton("DOCK", this.createDock);
        this._panel.addLargeButton("BANNER", this.createBanner);
        this._panel.addLargeButton("CRISTAL", this.createCristal);
        this._panel.addLargeButton("ROCK", this.createRock);
        this._panel.addLargeButton("WALL", this.createNode);
        this._panel.addTitle2("DATA");

        this._panel.addMediumButtons(
            "SAVE",
            () => {
                let data = Serializer.Serialize(Main.Scene);
                window.localStorage.setItem("scene-data", JSON.stringify(data));
            },
            "LOAD",
            () => {
                let data = JSON.parse(window.localStorage.getItem("scene-data"));
                Serializer.Deserialize(Main.Scene, data, this.owner);
                this.wallSystem.instantiate();
            }
        )

        this.addEventListenerDrag();

        this._panel.style.position = "fixed";
        this._panel.style.left = "15px";
        this._panel.style.top = "15px";
    }

    public disable() {
        this.removeEventListenerDrag();

        this._panel.dispose();
    }

    private createContainer = () => {
        this.selectedElement = undefined;
        this._newProp = new Container("", this.owner, BABYLON.Vector2.Zero(), 0);
        this._newProp.instantiate();
    }

    private createTank = () => {
        this.selectedElement = undefined;
        this._newProp = new Tank("", this.owner, BABYLON.Vector2.Zero(), 0);
        this._newProp.instantiate();
    }

    private createTurret = () => {
        this.selectedElement = undefined;
        this._newProp = new Turret("", this.owner, BABYLON.Vector2.Zero(), 0);
        this._newProp.instantiate();
    }

    private createLandingPad = () => {
        this.selectedElement = undefined;
        this._newProp = new LandingPad("", this.owner, BABYLON.Vector2.Zero(), 0);
        this._newProp.instantiate();
    }

    private createDock = () => {
        this.selectedElement = undefined;
        this._newProp = new Dock("", this.owner, BABYLON.Vector2.Zero(), 0);
        this._newProp.instantiate();
    }

    private createCristal = () => {
        this.selectedElement = undefined;
        this._newProp = new Cristal("", BABYLON.Vector2.Zero(), 0);
        this._newProp.instantiate();
    }

    private createRock = () => {
        this.selectedElement = undefined;
        this._newProp = new Rock("", BABYLON.Vector2.Zero(), 0);
        this._newProp.instantiate();
    }

    private createBanner = () => {
        this.selectedElement = undefined;
        this._newProp = new Banner("", BABYLON.Vector2.Zero(), 0, 1);
        this._newProp.instantiate();
    }

    private createNode = () => {
        this.selectedElement = undefined;
        this.removeEventListenerDrag();
        Main.Canvas.addEventListener("pointerup", this.pointerUpFirst);
    }

    private addEventListenerDrag(): void {
        this._selectedElement = undefined;
        Main.Canvas.addEventListener("pointerdown", this.pointerDown);
        Main.Canvas.addEventListener("pointermove", this.pointerMove);
        Main.Canvas.addEventListener("pointerup", this.pointerUp);
    }

    private removeEventListenerDrag(): void {
        Main.Canvas.removeEventListener("pointerdown", this.pointerDown);
        Main.Canvas.removeEventListener("pointermove", this.pointerMove);
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
                return m instanceof Draggable;
            }
        );
        if (pick.hit && pick.pickedMesh instanceof Draggable) {
            if (this.selectedElement === pick.pickedMesh) {
                this._draggedElement = pick.pickedMesh as Draggable;
                Main.Camera.detachControl(Main.Canvas);
            }
        }
    }

    private pointerMove = () => {
        if (this._draggedElement || this._newProp) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m === this._zero;
                }
            );
            if (this._draggedElement) {
                if (pick.hit) {
                    this._draggedElement.position2D.x = pick.pickedPoint.x;
                    this._draggedElement.position2D.y = pick.pickedPoint.z;
                    if (this._draggedElement instanceof WallNode) {
                        this.wallSystem.instantiate();
                    }
                }
            }
            else if (this._newProp) {
                if (pick.hit) {
                    this._newProp.isVisible = true;
                    this._newProp.position2D.x = pick.pickedPoint.x;
                    this._newProp.position2D.y = pick.pickedPoint.z;
                }
                else {
                    this._newProp.isVisible = false;
                }
            }
        }
    }

    private pointerUp = () => {
        if (this._newProp) {
            this._newProp.addToScene();
            this._newProp = undefined;
        }
        this._draggedElement = undefined;
        if (Math.abs(this.scene.pointerX - this._pointerDownX) < 3 && Math.abs(this.scene.pointerY - this._pointerDownY) < 3) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m instanceof Selectionable;
                }
            );
            if (pick.hit && pick.pickedMesh instanceof Selectionable) {
                this.selectedElement = pick.pickedMesh;
            }
            else {
                this.selectedElement = undefined;
            }
        }
        Main.Camera.attachControl(Main.Canvas);
    }

    private pointerUpFirst = () => {
        let pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => {
                return m === this._zero;
            }
        );
        if (pick.hit) {
            for (let i = 0; i < this.wallSystem.nodes.length; i++) {
                if (BABYLON.Vector3.DistanceSquared(this.wallSystem.nodes[i].position, pick.pickedPoint) < 1) {
                    this._selectedElement = this.wallSystem.nodes[i];
                    break;
                }
            }
            if (!this._selectedElement) {
                this._selectedElement = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), this.wallSystem);
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
                return m === this._zero;
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
            if (this._selectedElement instanceof WallNode && otherNode && (this._selectedElement !== otherNode)) {
                new Wall(this._selectedElement, otherNode)
            }
            Main.Canvas.removeEventListener("pointerup", this.pointerUpSecond);
            this.addEventListenerDrag();
            this.wallSystem.instantiate();
        }
    }
}