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
            new BABYLON.Vector3(radius, 2.4, 0.2)
        ];
        let bspc = baseShape.length;

        let d = 1;
        for (let i = 0; i < directions.length; i++) {
            
            let dir = directions[i];
            let cosDir = Math.cos(dir);
            let sinDir = Math.sin(dir);
            let n = new BABYLON.Vector2(- cosDir, - sinDir);

            let dirNext = directions[(i + 1) % directions.length];
            let cosDirNext = Math.cos(dirNext);
            let sinDirNext = Math.sin(dirNext);
            let nNext = new BABYLON.Vector2(- cosDirNext, - sinDirNext);

            for (let j = 0; j < bspc; j++) {
                let baseP = baseShape[j];
                positions.push(cosDir * baseP.x - sinDir * baseP.z);
                positions.push(baseP.y);
                positions.push(sinDir * baseP.x + cosDir * baseP.z);
            }
            
            
            for (let j = 0; j < bspc; j++) {
                let baseP = baseShape[j];

                let p = new BABYLON.Vector2(cosDir * baseP.x - sinDir * baseP.z, sinDir * baseP.x + cosDir * baseP.z);
                let pNext = new BABYLON.Vector2(cosDirNext * baseP.x + sinDirNext * baseP.z, sinDirNext * baseP.x - cosDirNext * baseP.z);

                let intersection = Math2D.RayRayIntersection(p, n, pNext, nNext);
                if (intersection) {
                    positions.push(intersection.x, baseP.y, intersection.y);
                }
                else {
                    positions.push(p.x, baseP.y, p.y);
                }
            }
 
            for (let j = 0; j < bspc; j++) {
                let baseP = baseShape[j];
                positions.push(cosDirNext * baseP.x + sinDirNext * baseP.z);
                positions.push(baseP.y);
                positions.push(sinDirNext * baseP.x - cosDirNext * baseP.z);
            }
        }

        console.log(positions.length / 3);

        let cCount = 3 * directions.length;
        for (let j = 0; j < cCount; j++) {
            for (let i = 0; i < bspc - 1; i++) {
                indices.push(
                    i + j * bspc,
                    i + ((j + 1) % cCount) * bspc,
                    i + 1 + ((j + 1) % cCount) * bspc
                );
                indices.push(
                    i + 1 + ((j + 1) % cCount) * bspc,
                    i + 1 + j * bspc,
                    i + j * bspc,
                );
            }
        }

        for (let i = 0; i < directions.length; i++) {
            indices.push(
                bspc - 1 + i * 3 * bspc,
                bspc - 1 + (i * 3 + 1) * bspc,
                bspc - 1 + (((i + 1) * 3 + 1) % cCount) * bspc
            );
            indices.push(
                bspc - 1 + (((i + 1) * 3 + 1) % cCount) * bspc,
                bspc - 1 + (((i + 1) * 3 + 2) % cCount) * bspc,
                bspc - 1 + i * 3 * bspc,
            )
        }

        data.positions = positions;
        data.indices = indices;

        let normals = [];
        BABYLON.VertexData.ComputeNormals(data.positions, data.indices, normals);
        data.normals = normals;

        return data;
    }
}