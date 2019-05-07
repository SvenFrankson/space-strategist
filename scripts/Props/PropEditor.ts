class PropEditor {

    public static Select(prop: Prop): void {

    }

    public static CreatePanel(prop: Prop, onDisposeCallback?: () => void): SpacePanel {
        let panel = SpacePanel.CreateSpacePanel();
        panel.setTarget(prop);
        panel.addTitle1(prop.elementName().toLocaleUpperCase());
        panel.addTitle2(prop.name.toLocaleUpperCase());
        panel.addNumberInput(
            "POS X",
            prop.position2D.x,
            (v) => {
                prop.position2D.x = v;
            }
        );
        panel.addNumberInput(
            "POS Y",
            prop.position2D.y,
            (v) => {
                prop.position2D.y = v;
            }
        );
        panel.addMediumButtons(
            "DELETE",
            () => {
                prop.dispose();
                if (onDisposeCallback) {
                    onDisposeCallback();
                }
            }
        );
        return panel;
    }

    public static Unselect(prop: Prop): void {

    }
}