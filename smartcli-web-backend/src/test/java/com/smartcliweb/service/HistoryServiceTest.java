package com.smartcliweb.service;

import com.smartcliweb.config.SmartcliWebProperties;
import com.smartcliweb.model.HistoryEntry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * HistoryService is the only mutable persistence surface in the app. The
 * Supabase migration (see supabase-persistence-context) is going to swap
 * the storage layer; these tests pin the user-visible contract so the
 * swap is safe.
 *
 * Constructs HistoryService manually with a @TempDir-backed properties
 * object, bypassing Spring — keeps the suite fast and lets us instantiate
 * a fresh instance per test for isolation.
 */
class HistoryServiceTest {

    @Test
    void addTwice_sameCommand_dedupes(@TempDir Path tmp) throws IOException {
        HistoryService svc = openOn(tmp.resolve("history.json"), 200);
        svc.add("git status", "git");
        svc.add("git status", "git");
        assertThat(svc.list()).hasSize(1);
        assertThat(svc.list().get(0).getCommand()).isEqualTo("git status");
    }

    @Test
    void addBeyondMax_trimsOldest(@TempDir Path tmp) throws IOException {
        HistoryService svc = openOn(tmp.resolve("history.json"), 3);
        svc.add("one",   "shell");
        svc.add("two",   "shell");
        svc.add("three", "shell");
        svc.add("four",  "shell");
        List<HistoryEntry> entries = svc.list();
        assertThat(entries).hasSize(3);
        // list() returns newest-first; "one" should have been trimmed.
        assertThat(entries).extracting(HistoryEntry::getCommand)
                .containsExactly("four", "three", "two");
    }

    @Test
    void delete_removesById(@TempDir Path tmp) throws IOException {
        HistoryService svc = openOn(tmp.resolve("history.json"), 200);
        HistoryEntry e1 = svc.add("git status", "git");
        svc.add("git diff", "git");
        boolean removed = svc.delete(e1.getId());
        assertThat(removed).isTrue();
        assertThat(svc.list()).extracting(HistoryEntry::getCommand)
                .containsExactly("git diff");
    }

    @Test
    void delete_unknownId_returnsFalse(@TempDir Path tmp) throws IOException {
        HistoryService svc = openOn(tmp.resolve("history.json"), 200);
        svc.add("git status", "git");
        boolean removed = svc.delete("not-a-real-id");
        assertThat(removed).isFalse();
        assertThat(svc.list()).hasSize(1);
    }

    @Test
    void clear_emptiesHistory(@TempDir Path tmp) throws IOException {
        HistoryService svc = openOn(tmp.resolve("history.json"), 200);
        svc.add("git status", "git");
        svc.add("git diff", "git");
        svc.clear();
        assertThat(svc.list()).isEmpty();
    }

    @Test
    void persistence_roundTripsAcrossFreshInstance(@TempDir Path tmp) throws IOException {
        Path historyFile = tmp.resolve("history.json");
        HistoryService first = openOn(historyFile, 200);
        first.add("git status", "git");
        first.add("kubectl get pods", "kubectl");

        // Re-open against the same file with a fresh instance.
        HistoryService second = openOn(historyFile, 200);
        assertThat(second.list()).extracting(HistoryEntry::getCommand)
                .containsExactlyInAnyOrder("git status", "kubectl get pods");
    }

    @Test
    void list_returnsNewestFirst(@TempDir Path tmp) throws IOException, InterruptedException {
        HistoryService svc = openOn(tmp.resolve("history.json"), 200);
        svc.add("first", "shell");
        // createdAt has millisecond resolution; sleep slightly so the order is
        // deterministic on fast machines.
        Thread.sleep(5);
        svc.add("second", "shell");
        Thread.sleep(5);
        svc.add("third", "shell");
        assertThat(svc.list()).extracting(HistoryEntry::getCommand)
                .containsExactly("third", "second", "first");
    }

    @Test
    void corruptHistoryFile_doesNotCrashInit(@TempDir Path tmp) throws IOException {
        Path historyFile = tmp.resolve("history.json");
        Files.writeString(historyFile, "this is not json");
        HistoryService svc = openOn(historyFile, 200);
        // init() swallows the parse error and starts empty per the
        // service's "don't crash the app on corrupt persistence" contract.
        assertThat(svc.list()).isEmpty();
        // Subsequent adds should overwrite the file with valid JSON.
        svc.add("git status", "git");
        assertThat(svc.list()).hasSize(1);
    }

    /** Open a fresh service against an explicit history file. */
    private HistoryService openOn(Path historyFile, int max) throws IOException {
        SmartcliWebProperties props = new SmartcliWebProperties();
        props.setHistoryFile(historyFile.toString());
        props.setMaxHistory(max);
        HistoryService svc = new HistoryService(props);
        svc.init();
        return svc;
    }
}
