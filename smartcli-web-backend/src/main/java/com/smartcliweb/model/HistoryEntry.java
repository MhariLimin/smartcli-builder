package com.smartcliweb.model;

import java.time.Instant;

public class HistoryEntry {
    private String id;
    private String command;
    private String category;
    private Instant createdAt;

    public HistoryEntry() {}

    public HistoryEntry(String id, String command, String category, Instant createdAt) {
        this.id = id;
        this.command = command;
        this.category = category;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
