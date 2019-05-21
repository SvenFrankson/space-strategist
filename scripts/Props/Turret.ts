class Turret extends Prop {

    private _headBase: BABYLON.Mesh;
    private _head: BABYLON.Mesh;
    private _canon: BABYLON.Mesh;

    public target: IHasPosRot;

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let turretCount = this.getScene().meshes.filter((m) => { return m instanceof Turret; }).length;
            this.name = "turret-" + turretCount;
        }
        this.obstacle = Obstacle.CreateRectWithPosRotSource(this, 2, 2);
        this.obstacle.name = name + "-obstacle";
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public async instantiate(): Promise<void> {
        let data = await VertexDataLoader.instance.getColorized("turret-base", "#ce7633", "#383838", "#6d6d6d", "#d0d0d0", "#ce7633");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;

        this._headBase = new BABYLON.Mesh("turret-canonBase");
        this._headBase.parent = this;
        this._headBase.position.copyFromFloats(0, 2.1, 0);

        this._head = new BABYLON.Mesh("turret-head");
        let headData = await VertexDataLoader.instance.getColorized("turret-head", "#ce7633", "#383838", "#6d6d6d");
        headData.applyToMesh(this._head);
        this._head.material = Main.cellShadingMaterial;
        this._head.parent = this._headBase;
        this._head.position.copyFromFloats(0, 0, 0);

        this._canon = new BABYLON.Mesh("turret-canon");
        let canonData = await VertexDataLoader.instance.getColorized("turret-canon", "#ce7633", "#383838", "#6d6d6d");
        canonData.applyToMesh(this._canon);
        this._canon.material = Main.cellShadingMaterial;
        this._canon.parent = this._head;
        this._canon.position.copyFromFloats(0, 0.7, 0);

        this.groundWidth = 2;
        this.height = 3;
    }

    private _dirForward: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _dirToTarget: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _update = () => {
        if (Math.random() < 1 / 30) {
            this.fire();
        }
        if (this.target) {
            this._dirForward.copyFromFloats(0, 1);
            this._dirToTarget.copyFrom(this.target.position2D);
            this._dirToTarget.subtractInPlace(this.position2D);
            let azimut = Math2D.AngleFromTo(this._dirForward, this._dirToTarget);
            this._headBase.rotation.y = - azimut;
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

    private async fire(): Promise<void> {
        let bullet = new BABYLON.Mesh("bullet");
        bullet.layerMask = 0x10000000;
        let data = await VertexDataLoader.instance.getColorized("turret-ammo", "#101010", "", "#d0d0d0");
        data.applyToMesh(bullet);
        bullet.rotation.y = this._headBase.rotation.y;
        bullet.rotation.x = this._canon.rotation.x;
        bullet.position.copyFrom(this.position);
        bullet.position.y += 2.8;
        let k = 0;
        let dir = this._canon.getDirection(BABYLON.Axis.Z).scaleInPlace(1);
        let ammoUpdate = () => {
            bullet.position.addInPlace(dir);
            k++;
            if (k < 30) {
                let t = k / 30;
                this._head.position.z = - 0.25 * ((1 - t) - Math.pow(1 - t, 16));
            }
            else {
                this._head.position.z = 0;
                if (k > 1000 || bullet.position.y < 0) {
                    bullet.getScene().onBeforeRenderObservable.removeCallback(ammoUpdate);
                    bullet.dispose();
                }
            }
        }
        bullet.getScene().onBeforeRenderObservable.add(ammoUpdate);
    }

    public elementName(): string {
        return "Turret";
    }
}