import { app } from "../../scripts/app.js";

const COLORS = {
    enabled: { color: "#233", bgcolor: "#253" },
    disabled: { color: "#322", bgcolor: "#422" },
};

app.registerExtension({
    name: "comfyui-lora-prompt-switch.textPromptSwitchColors",
    nodeCreated(node) {
        if (node.comfyClass !== "TextPromptSwitch") return;

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
