class NavGraphManager {

    private static _Instance: NavGraphManager;

    public static GetForRadius(radius: number): NavGraph {
        let navGraph = NavGraphManager._Instance._navGraphs.get(radius);
        if (!navGraph) {
            navGraph = new NavGraph();
            NavGraphManager._Instance._navGraphs.set(radius, navGraph);
        }
        return navGraph;
    }

    private _rawNavGraph: NavGraph;
    private _navGraphs: Map<number, NavGraph>;

    constructor() {
        NavGraphManager._Instance = this;
        this._rawNavGraph = new NavGraph();
        this._navGraphs = new Map<number, NavGraph>();
    }
}