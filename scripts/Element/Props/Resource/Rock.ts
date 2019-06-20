class Rock extends ResourceSpot {

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let rockCount = this.getScene().meshes.filter((m) => { return m instanceof Rock; }).length;
            this.name = "rock-" + rockCount;
        }
        this.obstacle = Obstacle.CreateHexagonWithPosRotSource(this, 2);
        this.obstacle.name = name + "-obstacle";
        this.resourceType = ResourceType.Rock;
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("cristal-2", "#b0b0b0", "#d0d0d0", "#dadada");
        for (let i = 0; i < vertexData.positions.length; i++) {
            vertexData.positions[i] *= 0.5;
        }

        let iHole0 = Math.round(this.position2D.x / 5) - Main.Ground.stepZeroW;
        let jHole0 = Math.round(this.position2D.y / 5) - Main.Ground.stepZeroH;
        let iHole1 = iHole0 - 1;
        let jHole1 = jHole0 - 1;

        let seamXMin = (Main.Ground.stepZeroW + iHole1) * 5;
        let seamXMax = (Main.Ground.stepZeroW + iHole0 + 1) * 5;
        let seamZMin = (Main.Ground.stepZeroH + jHole1) * 5;
        let seamZMax = (Main.Ground.stepZeroH + jHole0 + 1) * 5;

        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let x = vertexData.positions[3 * i];
            if (x === 2.5) {
                vertexData.positions[3 * i] = seamXMax - this.position2D.x;
            }
            if (x === - 2.5) {
                vertexData.positions[3 * i] = seamXMin - this.position2D.x;
            }
            let z = vertexData.positions[3 * i + 2];
            if (z === 2.5) {
                vertexData.positions[3 * i + 2] = seamZMax - this.position2D.y;
            }
            if (z === - 2.5) {
                vertexData.positions[3 * i + 2] = seamZMin - this.position2D.y;
            }
        }

        let min = Infinity;
        let max = - Infinity;
        this.height = - Infinity;
        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let x = vertexData.positions[3 * i];
            let y = vertexData.positions[3 * i + 1];
            let z = vertexData.positions[3 * i + 2];
            min = Math.min(min, x, z);
            max = Math.max(max, x, z);
            this.height = Math.max(this.height, y);
        }
        this.groundWidth = 4;

        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }

    protected onPositionChanged(): void {
        this.instantiate();
        Main.Ground.instantiateOld();
    }

    public elementName(): string {
        return "Rock";
    }
}