package com.smartcliweb.service;

import com.smartcliweb.config.SmartcliWebProperties;
import com.smartcliweb.model.SavedCommand;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

/**
 * File-backed store for {@link SavedCommand}s. Unlike {@link HistoryService},
 * saved commands do NOT dedupe by text — the same command can appear in
 * multiple folders with different labels. Storage / locking pattern mirrors
 * the other JSON-backed services.
 */
@Service
public class SavedCommandService {

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .enable(SerializationFeature.INDENT_OUTPUT);

    private final ReentrantLock lock = new ReentrantLock();
    private final SmartcliWebProperties props;

    private Path savedFile;
    private final List<SavedCommand> commands = new ArrayList<>();

    public SavedCommandService(SmartcliWebProperties props) {
        this.props = props;
    }

    @PostConstruct
    public void init() throws IOException {
        savedFile = Paths.get(props.getSavedFile());
        if (savedFile.getParent() != null) {
            Files.createDirectories(savedFile.getParent());
        }
        if (Files.exists(savedFile)) {
            try {
                SavedCommand[] arr = mapper.readValue(savedFile.toFile(), SavedCommand[].class);
                commands.addAll(Arrays.asList(arr));
            } catch (IOException e) {
                // Corrupt or empty file — start fresh.
                commands.clear();
            }
        }
    }

    /**
     * Returns the commands, optionally narrowed by folder and tag. {@code
     * folderId} matches verbatim (use the literal string "uncategorized" to
     * select rows with no folder); pass {@code null} to skip the filter.
     * Tag filter is OR semantics across the supplied set — a command with
     * any of the tags matches. Newest first.
     */
    public List<SavedCommand> list(String folderId, Set<String> tags) {
        lock.lock();
        try {
            return commands.stream()
                    .filter(c -> folderMatches(c, folderId))
                    .filter(c -> tagMatches(c, tags))
                    .sorted(Comparator.comparing(SavedCommand::getCreatedAt).reversed())
                    .collect(Collectors.toList());
        } finally {
            lock.unlock();
        }
    }

    private boolean folderMatches(SavedCommand c, String folderId) {
        if (folderId == null) return true;
        if ("uncategorized".equals(folderId)) return c.getFolderId() == null;
        return Objects.equals(c.getFolderId(), folderId);
    }

    private boolean tagMatches(SavedCommand c, Set<String> tags) {
        if (tags == null || tags.isEmpty()) return true;
        return c.getTags() != null && c.getTags().stream().anyMatch(tags::contains);
    }

    public Optional<SavedCommand> get(String id) {
        lock.lock();
        try {
            return commands.stream().filter(c -> Objects.equals(c.getId(), id)).findFirst();
        } finally {
            lock.unlock();
        }
    }

    public SavedCommand create(
            String command,
            String label,
            String category,
            String folderId,
            List<String> tags,
            String notes) throws IOException {
        lock.lock();
        try {
            Instant now = Instant.now();
            SavedCommand sc = new SavedCommand(
                    UUID.randomUUID().toString(),
                    command,
                    label,
                    category,
                    folderId,
                    tags,
                    notes,
                    now,
                    now
            );
            commands.add(sc);
            persist();
            return sc;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Partial update. Any non-null field replaces the current value; tags
     * are replaced wholesale when supplied (set to an empty list to clear).
     */
    public Optional<SavedCommand> update(
            String id,
            String label,
            String category,
            String folderId,
            List<String> tags,
            String notes) throws IOException {
        lock.lock();
        try {
            Optional<SavedCommand> maybe = commands.stream()
                    .filter(c -> Objects.equals(c.getId(), id))
                    .findFirst();
            if (maybe.isEmpty()) return maybe;
            SavedCommand sc = maybe.get();
            if (label != null) sc.setLabel(label);
            if (category != null) sc.setCategory(category);
            if (folderId != null) sc.setFolderId(folderId.isEmpty() ? null : folderId);
            if (tags != null) sc.setTags(tags);
            if (notes != null) sc.setNotes(notes);
            sc.setUpdatedAt(Instant.now());
            persist();
            return maybe;
        } finally {
            lock.unlock();
        }
    }

    public boolean delete(String id) throws IOException {
        lock.lock();
        try {
            boolean removed = commands.removeIf(c -> Objects.equals(c.getId(), id));
            if (removed) persist();
            return removed;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Clear the folderId on every command pointing at the deleted folder.
     * Called by {@link com.smartcliweb.controller.FolderController} on
     * folder delete so we never leave dangling references.
     */
    public void detachFolder(String folderId) throws IOException {
        lock.lock();
        try {
            boolean touched = false;
            Instant now = Instant.now();
            for (SavedCommand c : commands) {
                if (Objects.equals(c.getFolderId(), folderId)) {
                    c.setFolderId(null);
                    c.setUpdatedAt(now);
                    touched = true;
                }
            }
            if (touched) persist();
        } finally {
            lock.unlock();
        }
    }

    /** Set of all tags in use, sorted alphabetically — drives the chip strip. */
    public List<String> allTags() {
        lock.lock();
        try {
            return commands.stream()
                    .flatMap(c -> c.getTags() != null ? c.getTags().stream() : java.util.stream.Stream.empty())
                    .distinct()
                    .sorted(String.CASE_INSENSITIVE_ORDER)
                    .collect(Collectors.toList());
        } finally {
            lock.unlock();
        }
    }

    private void persist() throws IOException {
        mapper.writeValue(savedFile.toFile(), commands);
    }
}
