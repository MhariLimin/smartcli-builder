package com.smartcliweb.model;

import java.time.Instant;

/**
 * A user-created folder for organizing {@link SavedCommand}s. v1 ships flat
 * (the {@code parentId} field is on the model so the data shape stays stable
 * when nesting lands, but no service code consumes it yet).
 */
public class Folder {
    private String id;
    private String name;
    private String parentId;
    private Instant createdAt;

    public Folder() {}

    public Folder(String id, String name, String parentId, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.parentId = parentId;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
