# ComfyUI LoRA Prompt Switch

Custom nodes for ComfyUI that combine LoRA loading with prompt text injection and a boolean enable/disable switch. Chain multiple nodes together to build switchable LoRA+prompt stacks.

## Nodes

### LoRA Prompt Switch

Loads a LoRA and appends prompt text when enabled. When disabled, model/clip and prompts pass through unchanged.

**Inputs:**

| Input | Type | Description |
|---|---|---|
| model | MODEL | Base model |
| clip | CLIP | CLIP model |
| enable | BOOLEAN | Toggle this LoRA on/off (force input) |
| lora_name | dropdown | LoRA file to load |
| strength | FLOAT | LoRA strength (-10.0 to 10.0, default 1.0) |
| add_positive | STRING | Positive prompt text to append when enabled |
| add_negative | STRING | Negative prompt text to append when enabled |
| positive_prompt | STRING | (optional) Incoming positive prompt to extend |
| negative_prompt | STRING | (optional) Incoming negative prompt to extend |
| prompt_separator | STRING | (optional) Separator between prompt parts, default `", "` |

**Outputs:** `model`, `clip`, `positive_prompt`, `negative_prompt`

### Dual LoRA Prompt Switch

Same concept but for two model/clip pairs (e.g. high-noise and low-noise models in a dual-pass workflow). Each pair gets its own LoRA selection and strength. Prompt text is shared across both.

**Inputs:**

| Input | Type | Description |
|---|---|---|
| model_high | MODEL | High-noise model |
| model_low | MODEL | Low-noise model |
| enable | BOOLEAN | Toggle on/off (force input) |
| lora_high | dropdown | LoRA for high-noise model |
| strength_high | FLOAT | Strength for high-noise LoRA |
| lora_low | dropdown | LoRA for low-noise model |
| strength_low | FLOAT | Strength for low-noise LoRA |
| add_positive | STRING | Shared positive prompt text |
| add_negative | STRING | Shared negative prompt text |
| clip_high | CLIP | (optional) CLIP for high-noise model |
| clip_low | CLIP | (optional) CLIP for low-noise model |
| positive_prompt | STRING | (optional) Incoming positive prompt |
| negative_prompt | STRING | (optional) Incoming negative prompt |
| prompt_separator | STRING | (optional) Separator, default `", "` |

**Outputs:** `model_high`, `clip_high`, `model_low`, `clip_low`, `positive_prompt`, `negative_prompt`

### Text Prompt Switch

A simple text switch node. Appends text to an input string when enabled, passes through unchanged when disabled. Chain multiple to compose prompts from togglable blocks.

**Inputs:**

| Input | Type | Description |
|---|---|---|
| enable | BOOLEAN | Toggle on/off (force input) |
| text | STRING | Text to append when enabled |
| input_text | STRING | (optional) Incoming text to extend |
| separator | STRING | (optional) Separator, default `", "` |

**Outputs:** `text`

## Installation

Clone or copy this folder into your ComfyUI `custom_nodes` directory:

```
ComfyUI/custom_nodes/comfyui-lora-prompt-switch/
```

Restart ComfyUI. The nodes appear under the **loaders/lora** and **text** categories.

## Usage

1. Add a **LoRA Prompt Switch** node
2. Connect a boolean toggle (or chain of toggles) to the `enable` input
3. Select a LoRA and set strength
4. Type prompt additions into `add_positive` / `add_negative`
5. Chain multiple nodes by connecting `model` -> `model` and `positive_prompt` -> `positive_prompt` to build a switchable stack

## Note

This project was mostly AI-generated using [Claude Code](https://claude.com/claude-code).

## License

MIT
