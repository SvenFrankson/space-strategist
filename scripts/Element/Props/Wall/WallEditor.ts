class WallEditor {

    public static Select(wall: Wall): void {

    }

    public static CreatePanel(wall: Wall, onDisposeCallback: () => void): SpacePanel {
        let panel = SpacePanel.CreateSpacePanel();
        panel.setTarget(wall);
        panel.addTitle1("WALL");
        panel.addMediumButtons(
            "DELETE",
            () => {
                wall.dispose();
                wall.wallSystem.instantiate();
                onDisposeCallback();
            }
        );
        return panel;
    }

    public static Unselect(wall: Wall): void {

    }
}