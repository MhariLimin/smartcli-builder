package com.smartcliweb.model;

public class PlaceholderInfo {
    private String name;
    private String label;
    private String hint;

    public PlaceholderInfo() {}

    public PlaceholderInfo(String name, String label, String hint) {
        this.name = name;
        this.label = label;
        this.hint = hint;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }
}
