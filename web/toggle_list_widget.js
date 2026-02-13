import { app } from "../../scripts/app.js";

function injectStyles() {
    if (document.getElementById("toggle-list-widget-styles")) return;
    const style = document.createElement("style");
    style.id = "toggle-list-widget-styles";
    style.textContent = `
        .toggle-list-container {
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 4px;
            width: 100%;
            box-sizing: border-box;
        }
        .toggle-list-row {
            display: flex;
            align-items: center;
            gap: 4px;
            height: 26px;
        }
        .toggle-list-row input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
            flex-shrink: 0;
            accent-color: #4a9;
        }
        .toggle-list-row input[type="text"] {
            flex: 1;
            height: 22px;
            background: #2a2a2a;
            color: #ddd;
            border: 1px solid #444;
            border-radius: 3px;
            padding: 0 6px;
            font-size: 12px;
            min-width: 0;
        }
        .toggle-list-row input[type="text"]:focus {
            outline: 1px solid #5ae;
            border-color: #5ae;
        }
        .toggle-list-row input[type="text"].disabled-entry {
            opacity: 0.4;
            text-decoration: line-through;
        }
        .toggle-list-remove-btn {
            width: 22px;
            height: 22px;
            background: #422;
            color: #c88;
            border: 1px solid #633;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .toggle-list-remove-btn:hover {
            background: #533;
        }
        .toggle-list-add-btn {
            width: 100%;
            height: 24px;
            background: #333;
            color: #aaa;
            border: 1px dashed #555;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
        }
        .toggle-list-add-btn:hover {
            background: #444;
        }
        .toggle-list-entries {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-height: 87px;
            max-height: 200px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #555 #1a1a1a;
        }
        .toggle-list-entries::-webkit-scrollbar {
            width: 6px;
        }
        .toggle-list-entries::-webkit-scrollbar-track {
            background: #1a1a1a;
        }
        .toggle-list-entries::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 3px;
        }
        .toggle-list-label {
            font-size: 10px;
            color: #888;
            padding: 2px 0 0 0;
            user-select: none;
        }
        .lora-combo-row {
            display: flex;
            align-items: center;
            gap: 4px;
            width: 100%;
            box-sizing: border-box;
            padding: 2px 4px;
        }
        .lora-combo-label {
            font-size: 10px;
            color: #888;
            flex-shrink: 0;
            user-select: none;
        }
        .lora-combo-row select {
            flex: 1;
            height: 24px;
            background: #2a2a2a;
            color: #ddd;
            border: 1px solid #444;
            border-radius: 3px;
            font-size: 11px;
            min-width: 0;
        }
        .lora-combo-row select:focus {
            outline: 1px solid #5ae;
            border-color: #5ae;
        }
        .lora-combo-row input[type="number"] {
            width: 60px;
            height: 24px;
            background: #2a2a2a;
            color: #ddd;
            border: 1px solid #444;
            border-radius: 3px;
            padding: 0 4px;
            font-size: 11px;
            flex-shrink: 0;
        }
        .lora-combo-row input[type="number"]:focus {
            outline: 1px solid #5ae;
            border-color: #5ae;
        }
    `;
    document.head.appendChild(style);
}

function parseValue(raw) {
    if (!raw) {
        return [{ text: "", enabled: true }];
    }
    // ComfyUI may pass already-parsed arrays/objects on workflow reload
    if (Array.isArray(raw)) {
        const entries = raw
            .filter((e) => e && typeof e === "object")
            .map((e) => ({
                text: String(e.text || ""),
                enabled: e.enabled !== false,
            }));
        return entries.length > 0 ? entries : [{ text: "", enabled: true }];
    }
    if (typeof raw !== "string") {
        raw = String(raw);
    }
    if (!raw.trim()) {
        return [{ text: "", enabled: true }];
    }
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                const entries = parsed
                    .filter((e) => e && typeof e === "object")
                    .map((e) => ({
                        text: String(e.text || ""),
                        enabled: e.enabled !== false,
                    }));
                return entries.length > 0 ? entries : [{ text: "", enabled: true }];
            }
        } catch (e) {
            // fall through
        }
    }
    // Old workflow: plain text -> split on commas (outside parens) into entries
    const parts = splitOutsideParens(trimmed);
    if (parts.length > 0) {
        return parts.map((p) => ({ text: p, enabled: true }));
    }
    return [{ text: "", enabled: true }];
}

function splitOutsideParens(text) {
    const parts = [];
    let current = "";
    let depth = 0;
    for (const ch of text) {
        if (ch === "(" || ch === "[") depth++;
        else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
        else if (ch === "," && depth === 0) {
            parts.push(current.trim());
            current = "";
            continue;
        }
        current += ch;
    }
    parts.push(current.trim());
    return parts.filter((p) => p);
}

function trySplitEntry(entries, index, renderEntries, node) {
    const text = entries[index].text;
    const parts = splitOutsideParens(text);
    if (parts.length <= 1) return;
    const enabled = entries[index].enabled;
    entries.splice(index, 1, ...parts.map((p) => ({ text: p, enabled })));
    renderEntries();
    requestAnimationFrame(() => {
        node.setSize(node.computeSize());
        app.graph.setDirtyCanvas(true, false);
    });
}

function hideWidget(widget) {
    widget.type = "hidden";
    widget.hidden = true;
    widget.computeSize = () => [0, -4];
    // Prevent canvas drawing
    widget.draw = function () {};
}

function mergeLoraStrength(node, loraName, strengthName) {
    const loraWidget = node.widgets.find((w) => w.name === loraName);
    const strengthWidget = node.widgets.find((w) => w.name === strengthName);
    if (!loraWidget || !strengthWidget) return;

    // Get lora options and current value from the combo widget
    const loraOptions = loraWidget.options?.values || [];
    let currentLoraValue = loraWidget.value;
    const loraCallback = loraWidget.callback;
    const loraIndex = node.widgets.indexOf(loraWidget);

    // Create combined container
    const container = document.createElement("div");
    container.className = "lora-combo-row";

    // Label
    const label = document.createElement("span");
    label.className = "lora-combo-label";
    label.textContent = loraName.replace(/_/g, " ");
    container.appendChild(label);

    // Select dropdown
    const select = document.createElement("select");
    loraOptions.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        if (opt === currentLoraValue) option.selected = true;
        select.appendChild(option);
    });
    select.addEventListener("change", () => {
        currentLoraValue = select.value;
        loraCallback?.(select.value);
    });
    preventCanvasDrag(select);

    // Strength input
    const strengthInput = document.createElement("input");
    strengthInput.type = "number";
    strengthInput.value = strengthWidget.value;
    strengthInput.step = 0.01;
    strengthInput.min = -10;
    strengthInput.max = 10;
    strengthInput.title = "Strength";
    strengthInput.addEventListener("change", () => {
        const val = parseFloat(strengthInput.value) || 0;
        strengthWidget.value = val;
        strengthWidget.callback?.(val);
    });
    preventCanvasDrag(strengthInput);

    container.appendChild(select);
    container.appendChild(strengthInput);

    // Remove original lora widget from array (replaced by DOM widget below)
    node.widgets.splice(loraIndex, 1);

    // Hide strength widget visually (keep in array for serialization)
    hideWidget(strengthWidget);

    // Add DOM widget that replaces the lora widget (serializes lora value)
    const domWidget = node.addDOMWidget(loraName, "lora_combo", container, {
        getValue() {
            return currentLoraValue;
        },
        setValue(v) {
            currentLoraValue = v;
            select.value = v;
        },
    });

    // Move to same position as the original lora widget
    const currentIndex = node.widgets.indexOf(domWidget);
    if (currentIndex !== -1 && currentIndex !== loraIndex) {
        node.widgets.splice(currentIndex, 1);
        node.widgets.splice(loraIndex, 0, domWidget);
    }

    domWidget._isLoraCombo = true;
    domWidget._refreshDOM = () => {
        select.value = currentLoraValue;
        strengthInput.value = strengthWidget.value;
    };
}

function replaceWithToggleList(node, widgetName) {
    const origWidgetIndex = node.widgets.findIndex((w) => w.name === widgetName);
    if (origWidgetIndex === -1) return;

    const origWidget = node.widgets[origWidgetIndex];
    const origValue = origWidget.value || "";

    // Fully clean up the original widget's DOM elements
    origWidget.onRemove?.();
    const removeWidgetDOM = () => {
        origWidget.inputEl?.remove();
        origWidget.element?.remove();
    };
    removeWidgetDOM();
    // Deferred cleanup: DOM elements may be created after onNodeCreated
    requestAnimationFrame(removeWidgetDOM);

    // Internal state
    let entries = parseValue(origValue);

    // Create the container
    const container = document.createElement("div");
    container.className = "toggle-list-container";

    // Label
    const label = document.createElement("div");
    label.className = "toggle-list-label";
    label.textContent = widgetName === "add_positive" ? "positive tags" : "negative tags";
    container.appendChild(label);

    // Remove old widget
    node.widgets.splice(origWidgetIndex, 1);

    // Create DOM widget
    const domWidget = node.addDOMWidget(widgetName, "toggle_list", container, {
        getValue() {
            return JSON.stringify(entries);
        },
        setValue(v) {
            entries = parseValue(v);
            renderEntries();
            // Resize node to fit entries after value is loaded
            requestAnimationFrame(() => {
                node.setSize(node.computeSize());
                app.graph.setDirtyCanvas(true, false);
            });
        },
    });

    // Move to correct position
    const currentIndex = node.widgets.indexOf(domWidget);
    if (currentIndex !== -1 && currentIndex !== origWidgetIndex) {
        node.widgets.splice(currentIndex, 1);
        node.widgets.splice(origWidgetIndex, 0, domWidget);
    }

    domWidget._isToggleList = true;
    domWidget._refreshDOM = () => {
        renderEntries();
    };

    // Override computeSize to give toggle list enough height for entries
    domWidget.computeSize = function () {
        const entryH = 29; // row height + gap
        const minRows = 3;
        const visibleRows = Math.max(minRows, Math.min(entries.length, 7));
        const height = 20 + visibleRows * entryH + 30; // label + entries + button
        return [node.size[0], height];
    };

    renderEntries();

    function renderEntries() {
        // Keep label, remove everything else
        while (container.children.length > 1) {
            container.removeChild(container.lastChild);
        }

        // Scrollable entries wrapper
        const entriesDiv = document.createElement("div");
        entriesDiv.className = "toggle-list-entries";
        entries.forEach((entry, index) => {
            entriesDiv.appendChild(createEntryRow(entry, index));
        });
        container.appendChild(entriesDiv);

        // Add button
        const addBtn = document.createElement("button");
        addBtn.textContent = "+";
        addBtn.title = "Add entry";
        addBtn.className = "toggle-list-add-btn";
        addBtn.addEventListener("click", () => {
            entries.push({ text: "", enabled: true });
            renderEntries();
            requestAnimationFrame(() => {
                node.setSize(node.computeSize());
                app.graph.setDirtyCanvas(true, false);
            });
        });
        container.appendChild(addBtn);
    }

    function createEntryRow(entry, index) {
        const row = document.createElement("div");
        row.className = "toggle-list-row";

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = entry.enabled;
        checkbox.addEventListener("change", () => {
            entry.enabled = checkbox.checked;
            textInput.classList.toggle("disabled-entry", !entry.enabled);
        });
        preventCanvasDrag(checkbox);

        // Text input
        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.value = entry.text;
        textInput.placeholder = widgetName === "add_positive" ? "positive term..." : "negative term...";
        if (!entry.enabled) textInput.classList.add("disabled-entry");
        textInput.addEventListener("input", () => {
            entry.text = textInput.value;
        });
        textInput.addEventListener("paste", () => {
            // Let the paste complete, then split
            setTimeout(() => {
                entry.text = textInput.value;
                trySplitEntry(entries, index, renderEntries, node);
            }, 0);
        });
        textInput.addEventListener("blur", () => {
            entry.text = textInput.value;
            trySplitEntry(entries, index, renderEntries, node);
        });
        preventCanvasDrag(textInput);

        // Remove button
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "\u00d7";
        removeBtn.title = "Remove entry";
        removeBtn.className = "toggle-list-remove-btn";
        removeBtn.addEventListener("click", () => {
            entries.splice(index, 1);
            if (entries.length === 0) {
                entries.push({ text: "", enabled: true });
            }
            renderEntries();
            requestAnimationFrame(() => {
                node.setSize(node.computeSize());
                app.graph.setDirtyCanvas(true, false);
            });
        });
        preventCanvasDrag(removeBtn);

        row.appendChild(checkbox);
        row.appendChild(textInput);
        row.appendChild(removeBtn);
        return row;
    }
}

const NODE_COLORS = {
    enabled: { color: "#233", bgcolor: "#253" },
    disabled: { color: "#322", bgcolor: "#422" },
};

function addEnableColorFeedback(node) {
    const origOnDrawForeground = node.onDrawForeground;
    node.onDrawForeground = function (ctx) {
        const enableWidget = this.widgets?.find((w) => w.name === "enable");
        if (enableWidget) {
            const scheme = enableWidget.value ? NODE_COLORS.enabled : NODE_COLORS.disabled;
            if (this.color !== scheme.color || this.bgcolor !== scheme.bgcolor) {
                this.color = scheme.color;
                this.bgcolor = scheme.bgcolor;
            }
        }
        if (origOnDrawForeground) {
            origOnDrawForeground.apply(this, arguments);
        }
    };
}

function preventCanvasDrag(el) {
    el.addEventListener("mousedown", (e) => e.stopPropagation());
    el.addEventListener("pointerdown", (e) => e.stopPropagation());
}

app.registerExtension({
    name: "comfyui-lora-prompt-switch.toggleListWidget",

    init() {
        injectStyles();
    },

    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "LoRAPromptSwitch" && nodeData.name !== "DualLoRAPromptSwitch") {
            return;
        }

        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origOnNodeCreated?.apply(this, arguments);

            // Merge lora + strength into single rows
            if (nodeData.name === "LoRAPromptSwitch") {
                mergeLoraStrength(this, "lora_name", "strength");
            } else if (nodeData.name === "DualLoRAPromptSwitch") {
                mergeLoraStrength(this, "lora_high", "strength_high");
                mergeLoraStrength(this, "lora_low", "strength_low");
            }

            replaceWithToggleList(this, "add_positive");
            replaceWithToggleList(this, "add_negative");

            // Color feedback based on enable toggle
            addEnableColorFeedback(this);

            // Resize node to fit all custom widgets
            requestAnimationFrame(() => {
                this.setSize(this.computeSize());
                app.graph.setDirtyCanvas(true, false);
            });
        };

        const origOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
            origOnConfigure?.apply(this, arguments);
            for (const w of this.widgets || []) {
                if ((w._isToggleList || w._isLoraCombo) && w._refreshDOM) {
                    w._refreshDOM();
                }
            }
            // Resize after configure restores values
            requestAnimationFrame(() => {
                this.setSize(this.computeSize());
                app.graph.setDirtyCanvas(true, false);
            });
        };
    },
});
