abstract class ResourceSpot extends Prop {

    public resourceType: Resource;

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
    }
}