# Agent Guide

## Project Overview

ComfyUI custom node pack providing switchable LoRA loading with prompt injection. Three nodes: `LoRAPromptSwitch`, `DualLoRAPromptSwitch`, and `TextPromptSwitch`.

## Structure

- `__init__.py` — Entry point. Exports `NODE_CLASS_MAPPINGS`, `NODE_DISPLAY_NAME_MAPPINGS`, and sets `WEB_DIRECTORY = "./web"`.
- `lora_prompt_switch.py` — All node implementations, helpers `_append_text`, `_parse_toggle_list`, and `_log`.
- `web/toggle_list_widget.js` — Frontend extension for LoRA nodes: replaces `add_positive`/`add_negative` textareas with interactive toggle lists, merges lora+strength into compact combo rows.
- `web/text_prompt_switch.js` — Frontend extension for TextPromptSwitch: tints node green/red based on enable state.

## Key Conventions

- Nodes follow the ComfyUI node API: class with `INPUT_TYPES` classmethod, `RETURN_TYPES`, `FUNCTION`, and `CATEGORY`.
- Node classes are registered in `NODE_CLASS_MAPPINGS` / `NODE_DISPLAY_NAME_MAPPINGS` at the bottom of `lora_prompt_switch.py`.
- Optional inputs use `**kwargs` with `.get()` defaults rather than explicit parameters.
- When `enable=False`, nodes pass through all inputs unchanged (no LoRA loaded, no text appended).
- Debug logging is behind `DEBUG = False` flag; use `_log()` instead of `print()`.

## Data Format

The `add_positive`/`add_negative` fields use a JSON toggle-list format:
```json
[{"text": "trigger word", "enabled": true}, {"text": "disabled word", "enabled": false}]
```
Python's `_parse_toggle_list()` handles both JSON arrays and plain text (backward compat). The JS widget serializes entries as JSON via `getValue()`.

## Dependencies

- `comfy.sd`, `comfy.utils`, `folder_paths` — provided by the ComfyUI runtime. Not installable via pip.
- No external dependencies.

## Testing

No test suite. To test, load the nodes in a running ComfyUI instance. Debug output controlled by `DEBUG` flag in `lora_prompt_switch.py`.

## ComfyUI Frontend Widget Lessons Learned

### Widget Serialization (`widgets_values`)
- ComfyUI saves/loads widget values as an ordered array (`widgets_values`) indexed by position in the `node.widgets` array.
- `serialize: false` on `addDOMWidget` skips the widget during both save AND load — the array indices are adjusted to exclude it.
- **Critical: Never change the widget array length.** Adding or removing widgets shifts all indices, breaking saved workflows. When replacing a widget with a DOM widget, splice out the original and insert the DOM widget at the same index. Keep hidden widgets in the array if they need to serialize.

### Hiding Widgets
- `widget.type = "hidden"` alone may not fully hide all widget types (especially float sliders).
- Use the combination: `widget.type = "hidden"`, `widget.hidden = true`, `widget.computeSize = () => [0, -4]`, and `widget.draw = function() {}` to ensure no rendering.

### DOM Widgets (`addDOMWidget`)
- DOM widgets are positioned inline based on their index in `node.widgets`.
- `getValue()` / `setValue(v)` are called for serialization and restoration.
- `setValue` is called during `configure()` when loading a workflow — update internal state AND re-render DOM here.
- ComfyUI may pass already-parsed objects (not strings) to `setValue` on reload. Always handle both string and object inputs.
- DOM widget height is controlled by `widget.computeSize()` — override this to size the widget based on content.
- Call `node.setSize(node.computeSize())` + `app.graph.setDirtyCanvas(true, false)` inside `requestAnimationFrame` after changing content to resize the node.

### Replacing Textarea Widgets
- When replacing a multiline STRING widget with a DOM widget, clean up the original's DOM elements: `origWidget.onRemove?.()`, `origWidget.inputEl?.remove()`, `origWidget.element?.remove()`.
- Use `requestAnimationFrame` for deferred cleanup since DOM elements may not exist yet during `onNodeCreated`.

### Extension Hooks
- Use `beforeRegisterNodeDef` + `onNodeCreated` to modify widgets when a node is first created.
- Use `onConfigure` to refresh DOM widgets after workflow load (values are restored by then).
- Use `stopPropagation` on `mousedown`/`pointerdown` for interactive DOM elements to prevent canvas drag conflicts.

## Adding a New Node

1. Define the class in `lora_prompt_switch.py` (or a new file).
2. Register it in `NODE_CLASS_MAPPINGS` and `NODE_DISPLAY_NAME_MAPPINGS`.
3. If in a new file, import the mappings in `__init__.py` and merge them.
4. If adding frontend JS, place it in `web/` — it's auto-loaded via `WEB_DIRECTORY`.
