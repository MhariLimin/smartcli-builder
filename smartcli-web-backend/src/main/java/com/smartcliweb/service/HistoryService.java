package com.smartcliweb.service;

import com.smartcliweb.config.SmartcliWebProperties;
import com.smartcliweb.model.HistoryEntry;
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

@Service
public class HistoryService {

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .enable(SerializationFeature.INDENT_OUTPUT);

    private final ReentrantLock lock = new ReentrantLock();
    private final SmartcliWebProperties props;

    private Path historyFile;
    private final List<HistoryEntry> entries = new ArrayList<>();

    public HistoryService(SmartcliWebProperties props) {
        this.props = props;
    }

    @PostConstruct
    public void init() throws IOException {
        historyFile = Paths.get(props.getHistoryFile());
        if (historyFile.getParent() != null) {
            Files.createDirectories(historyFile.getParent());
        }
        if (Files.exists(historyFile)) {
            try {
                HistoryEntry[] arr = mapper.readValue(historyFile.toFile(), HistoryEntry[].class);
                entries.addAll(Arrays.asList(arr));
            } catch (IOException e) {
                // Corrupt or empty file — start fresh; don't crash the app.
                entries.clear();
            }
        }
    }

    public List<HistoryEntry> list() {
        lock.lock();
        try {
            List<HistoryEntry> copy = new ArrayList<>(entries);
            copy.sort(Comparator.comparing(HistoryEntry::getCreatedAt).reversed());
            return copy;
        } finally {
            lock.unlock();
        }
    }

    public HistoryEntry add(String command, String category) throws IOException {
        lock.lock();
        try {
            entries.removeIf(e -> Objects.equals(e.getCommand(), command));
            HistoryEntry entry = new HistoryEntry(
                    UUID.randomUUID().toString(),
                    command,
                    category,
                    Instant.now()
            );
            entries.add(entry);
            int max = props.getMaxHistory();
            if (entries.size() > max) {
                entries.sort(Comparator.comparing(HistoryEntry::getCreatedAt));
                entries.subList(0, entries.size() - max).clear();
            }
            persist();
            return entry;
        } finally {
            lock.unlock();
        }
    }

    public boolean delete(String id) throws IOException {
        lock.lock();
        try {
            boolean removed = entries.removeIf(e -> Objects.equals(e.getId(), id));
            if (removed) persist();
            return removed;
        } finally {
            lock.unlock();
        }
    }

    public void clear() throws IOException {
        lock.lock();
        try {
            entries.clear();
            persist();
        } finally {
            lock.unlock();
        }
    }

    private void persist() throws IOException {
        mapper.writeValue(historyFile.toFile(), entries);
    }
}
