class Turret extends Prop {

    private _head: BABYLON.Mesh;
    private _canon: BABYLON.Mesh;

    public target: IHasPosRot;

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let turretCount = this.getScene().meshes.filter((m) => { return m instanceof Turret; }).length;
            this.name = "turret-" + turretCount;
        }
        this.obstacle = Obstacle.CreateRectWithPosRotSource(this, 1, 1);
        this.obstacle.name = name + "-obstacle";
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public async instantiate(): Promise<void> {
        let data = await VertexDataLoader.instance.get("turret-base");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;

        this._head = new BABYLON.Mesh("turret-head");
        let headData = await VertexDataLoader.instance.get("turret-head");
        headData.applyToMesh(this._head);
        this._head.material = Main.cellShadingMaterial;
        this._head.parent = this;
        this._head.position.copyFromFloats(0, 2.1, 0);

        this._canon = new BABYLON.Mesh("turret-canon");
        let canonData = await VertexDataLoader.instance.get("turret-canon");
        canonData.applyToMesh(this._canon);
        this._canon.material = Main.cellShadingMaterial;
        this._canon.parent = this._head;
        this._canon.position.copyFromFloats(0, 0.7, 0);
    }

    private _dirForward: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _dirToTarget: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _update = () => {
        if (this.target) {
            this._dirForward.copyFromFloats(0, 1);
            this._dirToTarget.copyFrom(this.target.position2D);
            this._dirToTarget.subtractInPlace(this.position2D);
            let azimut = Math2D.AngleFromTo(this._dirForward, this._dirToTarget);
            this._head.rotation.y = - azimut;
            let tanElevation = 2.8 / this._dirToTarget.length();
            let elevation = Math.atan(tanElevation);
            this._canon.rotation.x = elevation;
        }
        else {
            let meshes = this.getScene().meshes.find((m) => { return m instanceof Fongus; });
            if (meshes instanceof Fongus) {
                this.target = meshes;
            }
        }
    }

    public elementName(): string {
        return "Turret";
    }
}