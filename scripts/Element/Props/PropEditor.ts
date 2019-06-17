class PropEditor {

    public static Select(prop: Prop): void {

    }

    public static CreatePanel(
        prop: Prop,
        onDisposeCallback?: () => void,
        onCloneCallback?: (clone: Prop) => void
    ): SpacePanel {
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
        panel.addNumberInput(
            "ROTATION",
            prop.rotation2D,
            (v) => {
                prop.rotation2D = v / 180 * Math.PI;
            }
        );
        panel.addMediumButtons(
            "CLONE",
            () => {
                let data = prop.serialize();
                let splitName = data.name.split("-");
                if (splitName.length === 2) {
                    let counter = parseInt(splitName[1]);
                    if (isFinite(counter)) {
                        data.name = splitName[0] + "-" + (counter + 1);
                    }
                }
                let clone = Prop.Deserialize(data, prop.owner);
                if (onCloneCallback) {
                    onCloneCallback(clone);
                }
            },
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