package com.smartcliweb.service;

import com.smartcliweb.config.SmartcliWebProperties;
import com.smartcliweb.model.SavedCommand;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SavedCommandService pinning. Covers the rules that differ from
 * HistoryService — no dedupe, filter-by-folder including the "uncategorized"
 * sentinel, filter-by-tag (OR), partial update, allTags ordering, and the
 * cascading {@link SavedCommandService#detachFolder(String)} hook called by
 * the folder-delete cascade.
 */
class SavedCommandServiceTest {

    @Test
    void create_assignsIdAndTimestamps(@TempDir Path tmp) throws IOException {
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        SavedCommand sc = svc.create("git status", "Git: working tree", "git", null, List.of("git"), null);
        assertThat(sc.getId()).isNotBlank();
        assertThat(sc.getCreatedAt()).isNotNull();
        assertThat(sc.getUpdatedAt()).isEqualTo(sc.getCreatedAt());
    }

    @Test
    void doesNotDedupeBySameCommandText(@TempDir Path tmp) throws IOException {
        // Distinct from HistoryService behaviour — the same command can
        // appear multiple times under different labels.
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        svc.create("git status", "label A", "git", null, Collections.emptyList(), null);
        svc.create("git status", "label B", "git", null, Collections.emptyList(), null);
        assertThat(svc.list(null, Collections.emptySet())).hasSize(2);
    }

    @Test
    void list_filtersByFolderId(@TempDir Path tmp) throws IOException {
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        svc.create("a", null, null, "F1", Collections.emptyList(), null);
        svc.create("b", null, null, "F2", Collections.emptyList(), null);
        svc.create("c", null, null, null, Collections.emptyList(), null);
        assertThat(svc.list("F1", Collections.emptySet()))
                .extracting(SavedCommand::getCommand).containsExactly("a");
        assertThat(svc.list("F2", Collections.emptySet()))
                .extracting(SavedCommand::getCommand).containsExactly("b");
    }

    @Test
    void list_uncategorizedSentinel_selectsRowsWithNoFolder(@TempDir Path tmp) throws IOException {
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        svc.create("a", null, null, "F1", Collections.emptyList(), null);
        svc.create("b", null, null, null, Collections.emptyList(), null);
        assertThat(svc.list("uncategorized", Collections.emptySet()))
                .extracting(SavedCommand::getCommand).containsExactly("b");
    }

    @Test
    void list_filtersByTags_orSemantics(@TempDir Path tmp) throws IOException {
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        svc.create("a", null, null, null, Arrays.asList("alpha", "beta"), null);
        svc.create("b", null, null, null, List.of("gamma"), null);
        svc.create("c", null, null, null, List.of("alpha"), null);

        // Single-tag filter matches both rows that carry it.
        assertThat(svc.list(null, Set.of("alpha")))
                .extracting(SavedCommand::getCommand).containsExactlyInAnyOrder("a", "c");

        // Multi-tag filter is OR — every row with any of the tags is returned.
        assertThat(svc.list(null, Set.of("beta", "gamma")))
                .extracting(SavedCommand::getCommand).containsExactlyInAnyOrder("a", "b");
    }

    @Test
    void update_patchesProvidedFieldsOnly(@TempDir Path tmp) throws IOException {
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        SavedCommand created = svc.create("git status", "old label", "git", null, List.of("git"), "old notes");
        // Only label + notes patched; tags / folderId / category left alone.
        Optional<SavedCommand> patched = svc.update(
                created.getId(),
                "new label",
                null,
                null,
                null,
                "new notes"
        );
        assertThat(patched).isPresent();
        SavedCommand sc = patched.get();
        assertThat(sc.getLabel()).isEqualTo("new label");
        assertThat(sc.getNotes()).isEqualTo("new notes");
        assertThat(sc.getCategory()).isEqualTo("git");
        assertThat(sc.getTags()).containsExactly("git");
    }

    @Test
    void update_folderIdEmptyString_clearsFolder(@TempDir Path tmp) throws IOException {
        // Empty string sentinel — distinct from null (= "leave unchanged")
        // — should detach the command from any folder.
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        SavedCommand created = svc.create("cmd", null, null, "F1", Collections.emptyList(), null);
        Optional<SavedCommand> patched = svc.update(created.getId(), null, null, "", null, null);
        assertThat(patched).isPresent();
        assertThat(patched.get().getFolderId()).isNull();
    }

    @Test
    void detachFolder_clearsFolderIdOnAllMatching(@TempDir Path tmp) throws IOException {
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        svc.create("a", null, null, "F1", Collections.emptyList(), null);
        svc.create("b", null, null, "F1", Collections.emptyList(), null);
        svc.create("c", null, null, "F2", Collections.emptyList(), null);
        svc.detachFolder("F1");
        // Both F1 rows now uncategorized; F2 untouched.
        assertThat(svc.list("uncategorized", Collections.emptySet()))
                .extracting(SavedCommand::getCommand).containsExactlyInAnyOrder("a", "b");
        assertThat(svc.list("F2", Collections.emptySet()))
                .extracting(SavedCommand::getCommand).containsExactly("c");
    }

    @Test
    void delete_removesById(@TempDir Path tmp) throws IOException {
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        SavedCommand created = svc.create("cmd", null, null, null, Collections.emptyList(), null);
        assertThat(svc.delete(created.getId())).isTrue();
        assertThat(svc.list(null, Collections.emptySet())).isEmpty();
    }

    @Test
    void delete_unknownId_returnsFalse(@TempDir Path tmp) throws IOException {
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        assertThat(svc.delete("not-a-real-id")).isFalse();
    }

    @Test
    void allTags_isDistinctAndAlphabeticalCaseInsensitive(@TempDir Path tmp) throws IOException {
        SavedCommandService svc = openOn(tmp.resolve("saved.json"));
        svc.create("a", null, null, null, Arrays.asList("zeta", "alpha", "Beta"), null);
        svc.create("b", null, null, null, List.of("alpha"), null);
        assertThat(svc.allTags()).containsExactly("alpha", "Beta", "zeta");
    }

    @Test
    void persistence_roundTripsAcrossFreshInstance(@TempDir Path tmp) throws IOException {
        Path file = tmp.resolve("saved.json");
        SavedCommandService first = openOn(file);
        first.create("a", "L", "git", "F1", List.of("t1"), "n");
        SavedCommandService second = openOn(file);
        List<SavedCommand> list = second.list(null, Collections.emptySet());
        assertThat(list).hasSize(1);
        assertThat(list.get(0).getCommand()).isEqualTo("a");
        assertThat(list.get(0).getTags()).containsExactly("t1");
    }

    private SavedCommandService openOn(Path file) throws IOException {
        SmartcliWebProperties props = new SmartcliWebProperties();
        props.setSavedFile(file.toString());
        SavedCommandService svc = new SavedCommandService(props);
        svc.init();
        return svc;
    }
}
