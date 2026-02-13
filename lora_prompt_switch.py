import json
import folder_paths
import comfy.utils
import comfy.sd

DEBUG = False


def _log(msg):
    if DEBUG:
        print(msg)


class LoRAPromptSwitch:
    """
    A single node that combines LoRA loading, prompt injection, and an enable/disable switch.
    Chain multiple instances to build a switchable LoRA+Prompt stack.
    """

    @classmethod
    def INPUT_TYPES(cls):
        lora_list = folder_paths.get_filename_list("loras")
        return {
            "required": {
                "model": ("MODEL",),
                "clip": ("CLIP",),
                "lora_name": (lora_list,),
                "strength": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),
                "add_positive": ("STRING", {"default": "", "multiline": True, "placeholder": "Additional positive prompt when enabled"}),
                "add_negative": ("STRING", {"default": "", "multiline": True, "placeholder": "Additional negative prompt when enabled"}),
            },
            "optional": {
                "positive_prompt": ("STRING", {"forceInput": True, "default": ""}),
                "negative_prompt": ("STRING", {"forceInput": True, "default": ""}),
                "prompt_separator": ("STRING", {"default": ", "}),
                "trailing_separator": ("BOOLEAN", {"default": True}),
                "notes": ("STRING", {"default": "", "multiline": True, "placeholder": "Notes, links, usage hints..."}),
                "enable": ("BOOLEAN", {"default": True}),
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP", "STRING", "STRING")
    RETURN_NAMES = ("model", "clip", "positive_prompt", "negative_prompt")
    FUNCTION = "apply"
    CATEGORY = "loaders/lora"

    def apply(self, model, clip, lora_name, strength,
              add_positive, add_negative, **kwargs):

        enable = kwargs.get("enable", True)
        positive_prompt = kwargs.get("positive_prompt", "")
        negative_prompt = kwargs.get("negative_prompt", "")

        if positive_prompt is None:
            positive_prompt = ""
        if negative_prompt is None:
            negative_prompt = ""

        _log(f"[LoRAPromptSwitch] enable={enable}, lora={lora_name}, strength={strength}")

        if not enable:
            _log(f"[LoRAPromptSwitch] DISABLED - passing through")
            return (model, clip, _append_text(positive_prompt, ""), _append_text(negative_prompt, ""))

        # Load LoRA
        lora_path = folder_paths.get_full_path("loras", lora_name)
        _log(f"[LoRAPromptSwitch] Loading LoRA from: {lora_path}")
        lora = comfy.utils.load_torch_file(lora_path, safe_load=True)
        model_lora, clip_lora = comfy.sd.load_lora_for_models(
            model, clip, lora, strength, strength
        )
        _log(f"[LoRAPromptSwitch] Model before: {id(model)}, after: {id(model_lora)}")

        # Append prompt text
        resolved_pos = _parse_toggle_list(add_positive)
        resolved_neg = _parse_toggle_list(add_negative)
        out_positive = _append_text(positive_prompt, resolved_pos)
        out_negative = _append_text(negative_prompt, resolved_neg)

        return (model_lora, clip_lora, out_positive, out_negative)


class DualLoRAPromptSwitch:
    """
    Like LoRAPromptSwitch but for two model/clip pairs (high noise & low noise).
    Each pair gets its own LoRA selection and strength.
    Prompt text is shared and appended to both.
    Clip and prompts are optional.
    """

    @classmethod
    def INPUT_TYPES(cls):
        lora_list = folder_paths.get_filename_list("loras")
        return {
            "required": {
                "model_high": ("MODEL",),
                "model_low": ("MODEL",),
                "lora_high": (lora_list,),
                "strength_high": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),
                "lora_low": (lora_list,),
                "strength_low": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),
                "add_positive": ("STRING", {"default": "", "multiline": True, "placeholder": "Additional positive prompt when enabled"}),
                "add_negative": ("STRING", {"default": "", "multiline": True, "placeholder": "Additional negative prompt when enabled"}),
            },
            "optional": {
                "clip_high": ("CLIP",),
                "clip_low": ("CLIP",),
                "positive_prompt": ("STRING", {"forceInput": True, "default": ""}),
                "negative_prompt": ("STRING", {"forceInput": True, "default": ""}),
                "prompt_separator": ("STRING", {"default": ", "}),
                "trailing_separator": ("BOOLEAN", {"default": True}),
                "notes": ("STRING", {"default": "", "multiline": True, "placeholder": "Notes, links, usage hints..."}),
                "enable": ("BOOLEAN", {"default": True}),
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP", "MODEL", "CLIP", "STRING", "STRING")
    RETURN_NAMES = ("model_high", "clip_high", "model_low", "clip_low", "positive_prompt", "negative_prompt")
    FUNCTION = "apply"
    CATEGORY = "loaders/lora"

    def apply(self, model_high, model_low,
              lora_high, strength_high,
              lora_low, strength_low,
              add_positive, add_negative, **kwargs):

        enable = kwargs.get("enable", True)
        clip_high = kwargs.get("clip_high", None)
        clip_low = kwargs.get("clip_low", None)
        positive_prompt = kwargs.get("positive_prompt", "")
        negative_prompt = kwargs.get("negative_prompt", "")

        if positive_prompt is None:
            positive_prompt = ""
        if negative_prompt is None:
            negative_prompt = ""

        _log(f"[DualLoRAPromptSwitch] enable={enable}, lora_high={lora_high}, lora_low={lora_low}")
        _log(f"[DualLoRAPromptSwitch] clip_high={'connected' if clip_high is not None else 'NONE'}, clip_low={'connected' if clip_low is not None else 'NONE'}")

        if not enable:
            _log(f"[DualLoRAPromptSwitch] DISABLED - passing through")
            return (model_high, clip_high, model_low, clip_low,
                    _append_text(positive_prompt, ""), _append_text(negative_prompt, ""))

        # Load LoRA for high noise model
        lora_high_path = folder_paths.get_full_path("loras", lora_high)
        _log(f"[DualLoRAPromptSwitch] Loading HIGH LoRA from: {lora_high_path}")
        lora_high_data = comfy.utils.load_torch_file(lora_high_path, safe_load=True)
        model_high_out, clip_high_out = comfy.sd.load_lora_for_models(
            model_high, clip_high, lora_high_data, strength_high, strength_high
        )
        _log(f"[DualLoRAPromptSwitch] HIGH Model before: {id(model_high)}, after: {id(model_high_out)}")

        # Load LoRA for low noise model
        lora_low_path = folder_paths.get_full_path("loras", lora_low)
        _log(f"[DualLoRAPromptSwitch] Loading LOW LoRA from: {lora_low_path}")
        lora_low_data = comfy.utils.load_torch_file(lora_low_path, safe_load=True)
        model_low_out, clip_low_out = comfy.sd.load_lora_for_models(
            model_low, clip_low, lora_low_data, strength_low, strength_low
        )
        _log(f"[DualLoRAPromptSwitch] LOW Model before: {id(model_low)}, after: {id(model_low_out)}")

        # Append prompt text (shared for both)
        resolved_pos = _parse_toggle_list(add_positive)
        resolved_neg = _parse_toggle_list(add_negative)
        out_positive = _append_text(positive_prompt, resolved_pos)
        out_negative = _append_text(negative_prompt, resolved_neg)

        return (model_high_out, clip_high_out, model_low_out, clip_low_out,
                out_positive, out_negative)


class TextPromptSwitch:
    """
    Simple text switch node. Appends text to a prompt string when enabled.
    Chain multiple to build switchable scene/tag blocks for prompt composition.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "enable": ("BOOLEAN", {"default": True}),
                "text": ("STRING", {"default": "", "multiline": True, "placeholder": "Text to append when enabled"}),
            },
            "optional": {
                "input_text": ("STRING", {"forceInput": True, "default": ""}),
                "separator": ("STRING", {"default": ", "}),
                "trailing_separator": ("BOOLEAN", {"default": True}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "apply"
    CATEGORY = "text"

    def apply(self, enable, text, **kwargs):
        input_text = kwargs.get("input_text", "")

        if input_text is None:
            input_text = ""

        if not enable:
            return (_append_text(input_text, ""),)

        return (_append_text(input_text, text),)


def _append_text(existing, addition):
    """Append text with comma separator and trailing comma."""
    raw = existing + ", " + addition if addition.strip() else existing
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    result = ", ".join(parts) if parts else ""
    if result:
        result = result + ", "
    return result


def _parse_toggle_list(raw_value):
    """Parse a toggle-list JSON string into combined text.

    Accepts JSON array [{"text": "...", "enabled": true}, ...] or plain text.
    Returns only enabled entries joined by comma. Plain text returned as-is.
    """
    if not raw_value or not raw_value.strip():
        return ""
    stripped = raw_value.strip()
    if stripped.startswith("["):
        try:
            entries = json.loads(stripped)
            if isinstance(entries, list):
                enabled = [
                    e["text"] for e in entries
                    if isinstance(e, dict) and e.get("enabled", True) and e.get("text", "").strip()
                ]
                return ", ".join(enabled) if enabled else ""
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    return stripped


NODE_CLASS_MAPPINGS = {
    "LoRAPromptSwitch": LoRAPromptSwitch,
    "DualLoRAPromptSwitch": DualLoRAPromptSwitch,
    "TextPromptSwitch": TextPromptSwitch,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LoRAPromptSwitch": "LoRA Prompt Switch",
    "DualLoRAPromptSwitch": "Dual LoRA Prompt Switch",
    "TextPromptSwitch": "Text Prompt Switch",
}
