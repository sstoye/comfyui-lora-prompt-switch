import { app } from "../../scripts/app.js";

const COLORS = {
    enabled: { color: "#233", bgcolor: "#253" },
    disabled: { color: "#322", bgcolor: "#422" },
};

function hideWidget(widget) {
    widget.type = "hidden";
    widget.hidden = true;
    widget.computeSize = () => [0, -4];
    widget.draw = function () {};
}

app.registerExtension({
    name: "comfyui-lora-prompt-switch.textPromptSwitch",
    nodeCreated(node) {
        if (node.comfyClass !== "TextPromptSwitch") return;

        // Hide separator widgets (kept in array for backward compat)
        for (const w of node.widgets || []) {
            if (w.name === "separator" || w.name === "trailing_separator") {
                hideWidget(w);
            }
        }

        // Resize after hiding widgets
        requestAnimationFrame(() => {
            node.setSize(node.computeSize());
            app.graph.setDirtyCanvas(true, false);
        });

        const origOnDrawForeground = node.onDrawForeground;
        node.onDrawForeground = function (ctx) {
            const enableWidget = this.widgets?.find((w) => w.name === "enable");
            if (enableWidget) {
                const scheme = enableWidget.value ? COLORS.enabled : COLORS.disabled;
                if (this.color !== scheme.color || this.bgcolor !== scheme.bgcolor) {
                    this.color = scheme.color;
                    this.bgcolor = scheme.bgcolor;
                }
            }
            if (origOnDrawForeground) {
                origOnDrawForeground.apply(this, arguments);
            }
        };
    },
});
