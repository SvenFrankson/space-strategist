/// <reference path="../Prop.ts"/>

class ResourceAvailableRequired {

    public available: number = 0;
    public required: number = 0;
}

abstract class Building extends Prop {
    
    public currentCompletion: number = 0;
    public completionRequired: number = 20;
    public resourcesAvailableRequired: Map<ResourceType, ResourceAvailableRequired> = new Map<ResourceType, ResourceAvailableRequired>();

    private _areaMesh: BABYLON.Mesh;

    constructor(name: string, owner: Player, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        this.owner = owner;
        this.resourcesAvailableRequired.set(ResourceType.Rock, new ResourceAvailableRequired());
        this.resourcesAvailableRequired.set(ResourceType.Steel, new ResourceAvailableRequired());
        this.resourcesAvailableRequired.set(ResourceType.Cristal, new ResourceAvailableRequired());
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
        this.currentCompletion += amount;
        this.currentCompletion = Math.min(this.completionRequired, this.currentCompletion);
        this.position.y = this.currentCompletion - this.completionRequired;
        if (this.currentCompletion === this.completionRequired) {
            this._areaMesh.dispose();
            this.addToScene();
        }
    }

    public gather(resource: number, type: ResourceType): void {
        let rAQ = this.resourcesAvailableRequired.get(resource);
        rAQ.available += resource;
        rAQ.available = Math.min(rAQ.available, rAQ.required);
    }
}