class PropsEditor {

    private currentProp: Prop;
    private ground: BABYLON.Mesh;

    constructor(
        public scene: BABYLON.Scene
    ) {
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 40, height: 40}, scene);
        this.enable();
        document.getElementById("add-container").addEventListener("click", this.createContainer);
        document.getElementById("add-tank").addEventListener("click", this.createTank);
    }

    public enable() {
        this.ground.isVisible = true;
        Main.Canvas.addEventListener("pointermove", this.pointerMove);
        Main.Canvas.addEventListener("pointerup", this.pointerUp);
    }

    public disable() {
        this.ground.isVisible = false;
        Main.Canvas.removeEventListener("pointermove", this.pointerMove);
        Main.Canvas.removeEventListener("pointerup", this.pointerUp);
    }

    private createContainer = () => {
        this.currentProp = new Container("container", BABYLON.Vector2.Zero(), 0);
        this.currentProp.instantiate();
    }

    private createTank = () => {
        this.currentProp = new Tank("tank", BABYLON.Vector2.Zero(), 0);
        this.currentProp.instantiate();
    }

    private pointerMove = () => {
        if (this.currentProp) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m === this.ground;
                }
            );
            if (pick.hit) {
                this.currentProp.isVisible = true;
                this.currentProp.position2D.x = pick.pickedPoint.x;
                this.currentProp.position2D.y = pick.pickedPoint.z;
                this.currentProp.position.x = this.currentProp.position2D.x;
                this.currentProp.position.z = this.currentProp.position2D.y;
            }
            else {
                this.currentProp.isVisible = false;
            }
        }
    }

    private pointerUp = () => {
        if (this.currentProp) {
            this.currentProp.addToScene();
            this.currentProp = undefined;
        }
    }
}