/// <reference path="../Prop.ts"/>

abstract class Building extends Prop {
    
    public completion: number = 0;
    public resourcesAvailable: number = 0;
    public resourcesRequired: number = 10;

    private _areaMesh: BABYLON.Mesh;

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
    }

    public abstract async instantiate(): Promise<void>;

    public async instantiateBuilding(): Promise<void> {
        await this.instantiate();
        this.position.y = -10;
        this._areaMesh = ShapeDraw.CreateCircle(this.groundWidth * 0.5, this.groundWidth * 0.5 + 0.15);
        this._areaMesh.position.copyFromFloats(
            this.position2D.x,
            0.1,
            this.position2D.y
        );
    }

    public build(amount: number): void {
        this.completion += amount;
        this.completion = Math.min(10, this.completion);
        this.position.y = this.completion - 10;
        if (this.completion === 10) {
            this._areaMesh.dispose();
        }
    }

    public gather(resource: number): void {
        this.resourcesAvailable += resource;
        this.resourcesAvailable = Math.min(this.resourcesRequired, this.resourcesAvailable);
    }
}