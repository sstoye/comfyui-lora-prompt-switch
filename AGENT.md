# Agent Guide

## Project Overview

ComfyUI custom node pack providing switchable LoRA loading with prompt injection. Three nodes: `LoRAPromptSwitch`, `DualLoRAPromptSwitch`, and `TextPromptSwitch`.

## Structure

- `__init__.py` — Entry point. Exports `NODE_CLASS_MAPPINGS` and `NODE_DISPLAY_NAME_MAPPINGS`.
- `lora_prompt_switch.py` — All node implementations and the shared `_append_text` helper.

## Key Conventions

- Nodes follow the ComfyUI node API: class with `INPUT_TYPES` classmethod, `RETURN_TYPES`, `FUNCTION`, and `CATEGORY`.
- Node classes are registered in `NODE_CLASS_MAPPINGS` / `NODE_DISPLAY_NAME_MAPPINGS` at the bottom of `lora_prompt_switch.py`.
- Optional inputs use `**kwargs` with `.get()` defaults rather than explicit parameters.
- When `enable=False`, nodes pass through all inputs unchanged (no LoRA loaded, no text appended).

## Dependencies

- `comfy.sd`, `comfy.utils`, `folder_paths` — provided by the ComfyUI runtime. Not installable via pip.
- No external dependencies.

## Testing

No test suite. To test, load the nodes in a running ComfyUI instance and check console output (nodes print `[LoRAPromptSwitch]` / `[DualLoRAPromptSwitch]` debug lines).

## Adding a New Node

1. Define the class in `lora_prompt_switch.py` (or a new file).
2. Register it in `NODE_CLASS_MAPPINGS` and `NODE_DISPLAY_NAME_MAPPINGS`.
3. If in a new file, import the mappings in `__init__.py` and merge them.
