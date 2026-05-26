package com.smartcliweb.service;

import com.smartcliweb.config.SmartcliWebProperties;
import com.smartcliweb.model.Folder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Mirrors the pattern in HistoryServiceTest — manual instantiation with a
 * @TempDir-backed properties object. FolderService is the simpler of the
 * two Saved-Commands stores; tests cover create / rename / delete /
 * persistence and the alphabetical list contract.
 */
class FolderServiceTest {

    @Test
    void create_returnsFolder_andListContainsIt(@TempDir Path tmp) throws IOException {
        FolderService svc = openOn(tmp.resolve("folders.json"));
        Folder folder = svc.create("Kafka prod", null);
        assertThat(folder.getId()).isNotBlank();
        assertThat(folder.getName()).isEqualTo("Kafka prod");
        assertThat(svc.list()).extracting(Folder::getName).containsExactly("Kafka prod");
    }

    @Test
    void list_isAlphabeticalCaseInsensitive(@TempDir Path tmp) throws IOException {
        FolderService svc = openOn(tmp.resolve("folders.json"));
        svc.create("zebra", null);
        svc.create("Apples", null);
        svc.create("middle", null);
        assertThat(svc.list()).extracting(Folder::getName)
                .containsExactly("Apples", "middle", "zebra");
    }

    @Test
    void rename_updatesName(@TempDir Path tmp) throws IOException {
        FolderService svc = openOn(tmp.resolve("folders.json"));
        Folder created = svc.create("old name", null);
        Optional<Folder> renamed = svc.rename(created.getId(), "new name");
        assertThat(renamed).isPresent();
        assertThat(renamed.get().getName()).isEqualTo("new name");
        assertThat(svc.get(created.getId()).get().getName()).isEqualTo("new name");
    }

    @Test
    void rename_unknownId_returnsEmpty(@TempDir Path tmp) throws IOException {
        FolderService svc = openOn(tmp.resolve("folders.json"));
        Optional<Folder> renamed = svc.rename("not-a-real-id", "whatever");
        assertThat(renamed).isEmpty();
    }

    @Test
    void delete_removesById(@TempDir Path tmp) throws IOException {
        FolderService svc = openOn(tmp.resolve("folders.json"));
        Folder f1 = svc.create("Personal", null);
        svc.create("Work", null);
        boolean removed = svc.delete(f1.getId());
        assertThat(removed).isTrue();
        assertThat(svc.list()).extracting(Folder::getName).containsExactly("Work");
    }

    @Test
    void delete_unknownId_returnsFalse(@TempDir Path tmp) throws IOException {
        FolderService svc = openOn(tmp.resolve("folders.json"));
        svc.create("Personal", null);
        assertThat(svc.delete("not-a-real-id")).isFalse();
        assertThat(svc.list()).hasSize(1);
    }

    @Test
    void persistence_roundTripsAcrossFreshInstance(@TempDir Path tmp) throws IOException {
        Path file = tmp.resolve("folders.json");
        FolderService first = openOn(file);
        first.create("A", null);
        first.create("B", null);
        FolderService second = openOn(file);
        assertThat(second.list()).extracting(Folder::getName).containsExactly("A", "B");
    }

    @Test
    void corruptFile_doesNotCrashInit(@TempDir Path tmp) throws IOException {
        Path file = tmp.resolve("folders.json");
        Files.writeString(file, "not json");
        FolderService svc = openOn(file);
        assertThat(svc.list()).isEmpty();
        svc.create("first", null);
        assertThat(svc.list()).hasSize(1);
    }

    private FolderService openOn(Path file) throws IOException {
        SmartcliWebProperties props = new SmartcliWebProperties();
        props.setFoldersFile(file.toString());
        FolderService svc = new FolderService(props);
        svc.init();
        return svc;
    }
}
