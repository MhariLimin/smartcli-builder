package com.smartcliweb.model;

import java.util.List;

public class Suggestion {
    private String text;
    private String description;
    private String category;
    private List<String> placeholders;
    private SuggestionKind kind;

    public Suggestion() {}

    public Suggestion(String text, String description, String category,
                      List<String> placeholders, SuggestionKind kind) {
        this.text = text;
        this.description = description;
        this.category = category;
        this.placeholders = placeholders;
        this.kind = kind;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<String> getPlaceholders() { return placeholders; }
    public void setPlaceholders(List<String> placeholders) { this.placeholders = placeholders; }

    public SuggestionKind getKind() { return kind; }
    public void setKind(SuggestionKind kind) { this.kind = kind; }
}
