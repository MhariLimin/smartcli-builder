package com.smartcliweb.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A user-saved CLI command. Distinct from {@link HistoryEntry}: history is
 * append-only and dedupes by text, while saved commands are user-curated and
 * may legitimately appear multiple times (same command, different labels or
 * folders).
 */
public class SavedCommand {
    private String id;
    private String command;
    private String label;
    private String category;
    private String folderId;
    private List<String> tags = new ArrayList<>();
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public SavedCommand() {}

    public SavedCommand(
            String id,
            String command,
            String label,
            String category,
            String folderId,
            List<String> tags,
            String notes,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.command = command;
        this.label = label;
        this.category = category;
        this.folderId = folderId;
        this.tags = tags != null ? tags : new ArrayList<>();
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getFolderId() { return folderId; }
    public void setFolderId(String folderId) { this.folderId = folderId; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags != null ? tags : new ArrayList<>(); }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
