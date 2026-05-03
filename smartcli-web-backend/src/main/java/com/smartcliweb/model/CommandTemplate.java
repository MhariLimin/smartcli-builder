package com.smartcliweb.model;

public class CommandTemplate {
    private String category;
    private String template;
    private String description;

    public CommandTemplate() {}

    public CommandTemplate(String category, String template, String description) {
        this.category = category;
        this.template = template;
        this.description = description;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = template; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
