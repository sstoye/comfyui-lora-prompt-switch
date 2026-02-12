import { app } from "../../scripts/app.js";

const COLORS = {
    enabled: { color: "#233", bgcolor: "#253" },
    disabled: { color: "#322", bgcolor: "#422" },
};

app.registerExtension({
    name: "comfyui-lora-prompt-switch.textPromptSwitchColors",
    nodeCreated(node) {
        if (node.comfyClass !== "TextPromptSwitch") return;

        const enableWidget = node.widgets?.find((w) => w.name === "enable");
        if (!enableWidget) return;

        const updateColor = () => {
            const scheme = enableWidget.value ? COLORS.enabled : COLORS.disabled;
            node.color = scheme.color;
            node.bgcolor = scheme.bgcolor;
            node.setDirtyCanvas(true, true);
        };

        updateColor();

        const origCallback = enableWidget.callback;
        enableWidget.callback = function (value) {
            if (origCallback) origCallback.call(this, value);
            updateColor();
        };
    },
});
