package com.smartcliweb.controller;

import com.smartcliweb.model.Folder;
import com.smartcliweb.service.FolderService;
import com.smartcliweb.service.SavedCommandService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService folderService;
    private final SavedCommandService savedService;

    public FolderController(FolderService folderService, SavedCommandService savedService) {
        this.folderService = folderService;
        this.savedService = savedService;
    }

    @GetMapping
    public List<Folder> list() {
        return folderService.list();
    }

    @PostMapping
    public Folder create(@RequestBody CreateRequest body) throws IOException {
        return folderService.create(body.name(), body.parentId());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Folder> rename(@PathVariable String id, @RequestBody RenameRequest body) throws IOException {
        Optional<Folder> updated = folderService.rename(id, body.name());
        return updated.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws IOException {
        boolean ok = folderService.delete(id);
        if (!ok) return ResponseEntity.notFound().build();
        // Cascade: any saved commands pointing at this folder lose their
        // folderId (rather than being deleted with the folder). The user's
        // commands are precious; the folder is just an organizational label.
        savedService.detachFolder(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateRequest(@NotBlank String name, String parentId) {}
    public record RenameRequest(@NotBlank String name) {}
}
