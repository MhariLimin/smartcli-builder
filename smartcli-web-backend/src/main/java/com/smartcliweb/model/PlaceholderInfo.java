package com.smartcliweb.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlaceholderInfo {
    private String name;
    private String label;
    private String hint;
    // Typed-placeholder extensions (see typed-placeholders feature).
    // `type` is null for the legacy `<name>` form; otherwise one of
    // "int", "float", "bool", "enum", "string", "path", "url".
    private String type;
    // Non-null only when `type` is "enum". Order preserved from the catalog.
    private List<String> enumOptions;
    // Non-null when the slot supplied `=default`.
    private String defaultValue;
    // The literal slot text including angle brackets, e.g. "<port:int=22>".
    // The frontend uses this to substitute the slot in place, so it doesn't
    // need to reconstruct it from name + type + enum + default.
    private String slot;

    public PlaceholderInfo() {}

    public PlaceholderInfo(String name, String label, String hint) {
        this(name, label, hint, null, null, null, null);
    }

    public PlaceholderInfo(String name, String label, String hint,
                           String type, List<String> enumOptions,
                           String defaultValue, String slot) {
        this.name = name;
        this.label = label;
        this.hint = hint;
        this.type = type;
        this.enumOptions = enumOptions;
        this.defaultValue = defaultValue;
        this.slot = slot;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<String> getEnumOptions() { return enumOptions; }
    public void setEnumOptions(List<String> enumOptions) { this.enumOptions = enumOptions; }

    public String getDefaultValue() { return defaultValue; }
    public void setDefaultValue(String defaultValue) { this.defaultValue = defaultValue; }

    public String getSlot() { return slot; }
    public void setSlot(String slot) { this.slot = slot; }
}
