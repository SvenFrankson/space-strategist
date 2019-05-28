class Turret extends Prop {

    public static Instances: Turret[] = [];

    public fireRate: number = 30; // Rounds per minute.
    private get _fireCooldownMax(): number { // In Seconds
        return 60 / this.fireRate;
    }
    private _fireCooldown: number = 0;
    public range: number = 30;
    public get rangeSquared(): number {
        return this.range * this.range;
    }
    public rotationSpeed: number = Math.PI / 2;  // Radian per second.

    private _headBase: BABYLON.Mesh;
    private _head: BABYLON.Mesh;
    private _canon: BABYLON.Mesh;

    public target: Character;
    private _targetAzimut: number = 0;
    private _targetElevation: number = 0;

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let turretCount = this.getScene().meshes.filter((m) => { return m instanceof Turret; }).length;
            this.name = "turret-" + turretCount;
        }

        this._headBase = new BABYLON.Mesh("turret-canonBase");
        this._headBase.parent = this;
        this._headBase.position.copyFromFloats(0, 2.1, 0);

        this._head = new BABYLON.Mesh("turret-head");
        this._head.parent = this._headBase;
        this._head.position.copyFromFloats(0, 0, 0);

        this._canon = new BABYLON.Mesh("turret-canon");
        this._canon.parent = this._head;
        this._canon.position.copyFromFloats(0, 0.7, 0);

        this.obstacle = Obstacle.CreateRectWithPosRotSource(this, 2, 2);
        this.obstacle.name = name + "-obstacle";
        this.getScene().onBeforeRenderObservable.add(this._update);

        Turret.Instances.push(this);
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        let index = Turret.Instances.indexOf(this);
        if (index !== -1) {
            Turret.Instances.splice(index, 1);
        }
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    public async instantiate(): Promise<void> {
        let data = await VertexDataLoader.instance.getColorized("turret-base", "#ce7633", "#383838", "#6d6d6d", "#d0d0d0", "#ce7633");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
        
        let headData = await VertexDataLoader.instance.getColorized("turret-head", "#ce7633", "#383838", "#6d6d6d");
        headData.applyToMesh(this._head);
        this._head.material = Main.cellShadingMaterial;
        
        let canonData = await VertexDataLoader.instance.getColorized("turret-canon", "#ce7633", "#383838", "#6d6d6d");
        canonData.applyToMesh(this._canon);
        this._canon.material = Main.cellShadingMaterial;

        this.groundWidth = 2;
        this.height = 3;
    }

    private _dirToTarget: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _update = () => {
        let dt = this.getScene().getEngine().getDeltaTime() / 1000;
        this._headBase.rotation.y = Math2D.StepFromToCirular(this._headBase.rotation.y, this._targetAzimut, this.rotationSpeed * dt);
        this._canon.rotation.x = Math2D.StepFromToCirular(this._canon.rotation.x, this._targetElevation, this.rotationSpeed * dt);
        if (this.target && this.target.alive) {
            let distSquared = this.position2D.subtract(this.target.position2D).lengthSquared();
            if (distSquared < this.rangeSquared) {
                if (Math2D.AreEqualsCircular(this._headBase.rotation.y, this._targetAzimut)) {
                    if (Math2D.AreEqualsCircular(this._canon.rotation.x, this._targetElevation)) {
                        this._fire();
                    }
                }
            }
            this._dirToTarget.copyFrom(this.target.position2D);
            this._dirToTarget.subtractInPlace(this.position2D);
            let azimut = Math2D.AngleFromTo(this.forward2D, this._dirToTarget);
            this._targetAzimut = - azimut;
            let tanElevation = 2.8 / this._dirToTarget.length();
            let elevation = Math.atan(tanElevation);
            this._targetElevation = elevation;
        }
        else {
            let mesh = this.getScene().meshes.find((m) => { return (m instanceof Fongus) && m.alive; });
            if (mesh instanceof Fongus) {
                this.target = mesh;
            }
            else {
                this._targetAzimut = 0;
                this._targetElevation = 0;
            }
        }
    }

    private async _fire(): Promise<void> {
        this._fireCooldown -= this.getScene().getEngine().getDeltaTime() / 1000;
        if (this._fireCooldown > 0) {
            return;
        }
        this._fireCooldown = this._fireCooldownMax;
        let bullet = new BABYLON.Mesh("bullet");
        bullet.layerMask = 0x10000000;
        let data = await VertexDataLoader.instance.getColorized("turret-ammo", "#101010", "", "#d0d0d0");
        data.applyToMesh(bullet);
        bullet.rotation.y = - this.rotation2D + this._headBase.rotation.y;
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
                    this.target.wound();
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