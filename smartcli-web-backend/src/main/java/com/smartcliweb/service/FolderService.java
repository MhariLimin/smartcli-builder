package com.smartcliweb.service;

import com.smartcliweb.config.SmartcliWebProperties;
import com.smartcliweb.model.Folder;
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

/**
 * File-backed folder store mirroring the {@link HistoryService} pattern:
 * single-user, ReentrantLock-guarded list of folders persisted to a JSON
 * file. Multi-user persistence is the supabase-persistence follow-up.
 */
@Service
public class FolderService {

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .enable(SerializationFeature.INDENT_OUTPUT);

    private final ReentrantLock lock = new ReentrantLock();
    private final SmartcliWebProperties props;

    private Path foldersFile;
    private final List<Folder> folders = new ArrayList<>();

    public FolderService(SmartcliWebProperties props) {
        this.props = props;
    }

    @PostConstruct
    public void init() throws IOException {
        foldersFile = Paths.get(props.getFoldersFile());
        if (foldersFile.getParent() != null) {
            Files.createDirectories(foldersFile.getParent());
        }
        if (Files.exists(foldersFile)) {
            try {
                Folder[] arr = mapper.readValue(foldersFile.toFile(), Folder[].class);
                folders.addAll(Arrays.asList(arr));
            } catch (IOException e) {
                // Corrupt or empty file — start fresh; don't crash the app.
                folders.clear();
            }
        }
    }

    public List<Folder> list() {
        lock.lock();
        try {
            List<Folder> copy = new ArrayList<>(folders);
            // Stable alphabetical ordering — most listing UIs expect it.
            copy.sort(Comparator.comparing(Folder::getName, String.CASE_INSENSITIVE_ORDER));
            return copy;
        } finally {
            lock.unlock();
        }
    }

    public Optional<Folder> get(String id) {
        lock.lock();
        try {
            return folders.stream().filter(f -> Objects.equals(f.getId(), id)).findFirst();
        } finally {
            lock.unlock();
        }
    }

    public Folder create(String name, String parentId) throws IOException {
        lock.lock();
        try {
            Folder folder = new Folder(
                    UUID.randomUUID().toString(),
                    name,
                    parentId,
                    Instant.now()
            );
            folders.add(folder);
            persist();
            return folder;
        } finally {
            lock.unlock();
        }
    }

    /** Returns the updated folder, or empty if no folder with that id exists. */
    public Optional<Folder> rename(String id, String name) throws IOException {
        lock.lock();
        try {
            Optional<Folder> maybe = folders.stream()
                    .filter(f -> Objects.equals(f.getId(), id))
                    .findFirst();
            if (maybe.isEmpty()) return maybe;
            maybe.get().setName(name);
            persist();
            return maybe;
        } finally {
            lock.unlock();
        }
    }

    public boolean delete(String id) throws IOException {
        lock.lock();
        try {
            boolean removed = folders.removeIf(f -> Objects.equals(f.getId(), id));
            if (removed) persist();
            return removed;
        } finally {
            lock.unlock();
        }
    }

    private void persist() throws IOException {
        mapper.writeValue(foldersFile.toFile(), folders);
    }
}
