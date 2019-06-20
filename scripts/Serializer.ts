interface IVector2 {
    x: number;
    y: number;
}

class SceneData {
    public props: PropData[] = [];
    public wallSystemDatas: WallSystemData[] = [];
}

class Serializer {

    public static findProps(scene: BABYLON.Scene): Prop[] {
        let props = [];
        for (let i = 0; i < scene.meshes.length; i++) {
            let mesh = scene.meshes[i];
            if (mesh instanceof Prop) {
                if (!(mesh instanceof Wall || mesh instanceof WallNode)) {
                    props.push(mesh);
                }
            }
        }
        return props;
    }

    public static findWallSystems(scene: BABYLON.Scene): WallSystem[] {
        let wallSystems = [];
        for (let i = 0; i < scene.transformNodes.length; i++) {
            let node = scene.transformNodes[i];
            if (node instanceof WallSystem) {
                if (wallSystems.indexOf(node) === -1) {
                    wallSystems.push(node);
                }
            }
        }
        return wallSystems;
    }

    public static Serialize(scene: BABYLON.Scene): SceneData {
        let data = new SceneData();
        let props = Serializer.findProps(scene);
        for (let i = 0; i < props.length; i++) {
            data.props.push(props[i].serialize());
        }
        let wallSystems = Serializer.findWallSystems(scene);
        for (let i = 0; i < wallSystems.length; i++) {
            data.wallSystemDatas.push(wallSystems[i].serialize());
        }
        return data;
    }

    public static async Deserialize(scene: BABYLON.Scene, data: SceneData, owner: Player): Promise<void> {
        let propsData = data.props;
        for (let i = 0; i < propsData.length; i++) {
            let prop = Prop.Deserialize(propsData[i], owner);
            await prop.instantiate();
            prop.addToScene();
        }
        let wallSystems = Serializer.findWallSystems(scene);
        // Note : Wrong actually, should delete and rebuild.
        for (let i = 0; i < wallSystems.length; i++) {
            wallSystems[0].deserialize(data.wallSystemDatas[0]);
            await wallSystems[0].instantiate();
            wallSystems[0].addToScene();
        }
    }
}