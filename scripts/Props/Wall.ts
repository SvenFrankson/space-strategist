class WallNode {

    public static BuildVertexData(radius: number = 2, ...directions: number[]): BABYLON.VertexData {
        let data = new BABYLON.VertexData();

        let positions: number[] = [];
        let indices: number[] = [];

        let baseShape = [
            new BABYLON.Vector3(radius, 0, 0.6),
            new BABYLON.Vector3(radius, 0.2, 0.6),
            new BABYLON.Vector3(radius, 1, 0.35),
            new BABYLON.Vector3(radius, 1.1, 0.35),
            new BABYLON.Vector3(radius, 2, 0.2),
            new BABYLON.Vector3(radius, 2.4, 0.2),
            new BABYLON.Vector3(radius, 0, - 0.6),
            new BABYLON.Vector3(radius, 0.2, - 0.6),
            new BABYLON.Vector3(radius, 1, - 0.35),
            new BABYLON.Vector3(radius, 1.1, - 0.35),
            new BABYLON.Vector3(radius, 2, - 0.2),
            new BABYLON.Vector3(radius, 2.4, - 0.2)
        ];

        for (let i = 0; i < directions.length; i++) {
            let l = positions.length / 3;
            let dir = directions[i];
            let cosDir = Math.cos(dir);
            let sinDir = Math.sin(dir);
            for (let j = 0; j < baseShape.length; j++) {
                let baseP = baseShape[j];
                positions.push(cosDir * baseP.x - sinDir * baseP.z);
                positions.push(baseP.y);
                positions.push(sinDir * baseP.x + cosDir * baseP.z);
            }
            for (let j = 0; j < 6 - 1; j++) {
                indices.push(l + j, l + j + 1, l + j + 6);
                indices.push(l + j + 1, l + j + 1 + 6, l + j + 6);
            }

            let n = new BABYLON.Vector2(- cosDir, - sinDir);
            let dirNext = directions[(i + 1) % directions.length];
            let cosDirNext = Math.cos(dirNext);
            let sinDirNext = Math.sin(dirNext);
            let nNext = new BABYLON.Vector2(- cosDirNext, - sinDirNext);
            
            l = positions.length / 3;
            
            for (let j = 0; j < 6; j++) {
                let baseP = baseShape[j];
                let basePNext = baseShape[j + 6];

                let p = new BABYLON.Vector2(cosDir * baseP.x - sinDir * baseP.z, sinDir * baseP.x + cosDir * baseP.z);
                let pNext = new BABYLON.Vector2(cosDirNext * basePNext.x - sinDirNext * basePNext.z, sinDirNext * basePNext.x + cosDirNext * basePNext.z);

                let intersection = Math2D.RayRayIntersection(p, n, pNext, nNext);
                positions.push(p.x, baseP.y, p.y);
                if (intersection) {
                    positions.push(intersection.x, baseP.y, intersection.y);
                }
                else {
                    positions.push(p.x, baseP.y, p.y);
                }
                positions.push(pNext.x, baseP.y, pNext.y);
            }

            for (let j = 0; j < 6 - 1; j++) {
                indices.push(l + 3 * j, l + 3 * j + 1, l + 3 * (j + 1) + 1);
                indices.push(l + 3 * (j + 1) + 1, l + 3 * (j + 1), l + 3 * j);

                indices.push(l + 3 * j + 1, l + 3 * j + 2, l + 3 * (j + 1) + 2);
                indices.push(l + 3 * (j + 1) + 2, l + 3 * (j + 1) + 1, l + 3 * j + 1);
            }
        }

        data.positions = positions;
        data.indices = indices;

        return data;
    }
}