class WallNodeEditor {

    public static Select(node: WallNode): void {

    }

    public static CreatePanel(node: WallNode, onDisposeCallback: () => void): SpacePanel {
        let panel = SpacePanel.CreateSpacePanel();
        panel.setTarget(node);
        panel.addTitle1("WALLNODE");
        panel.addNumberInput(
            "POS X",
            node.position2D.x,
            (v) => {
                node.position2D.x = v;
                node.wallSystem.instantiate();
            }
        );
        panel.addNumberInput(
            "POS Y",
            node.position2D.y,
            (v) => {
                node.position2D.y = v;
                node.wallSystem.instantiate();
            }
        );
        panel.addMediumButtons(
            "DELETE",
            () => {
                node.dispose();
                node.wallSystem.instantiate();
                onDisposeCallback();
            }
        );
        return panel;
    }

    public static Unselect(node: WallNode): void {

    }
}