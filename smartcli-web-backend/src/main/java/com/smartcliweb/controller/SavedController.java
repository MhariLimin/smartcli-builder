package com.smartcliweb.controller;

import com.smartcliweb.model.SavedCommand;
import com.smartcliweb.service.SavedCommandService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/saved")
public class SavedController {

    private final SavedCommandService service;

    public SavedController(SavedCommandService service) {
        this.service = service;
    }

    /**
     * Filter semantics:
     *  - {@code folder} — match the folder id verbatim, or the literal
     *    string {@code "uncategorized"} to select commands with no folder.
     *    Omit to skip the filter.
     *  - {@code tags} — comma-separated; commands matching any one tag are
     *    returned (OR).
     */
    @GetMapping
    public List<SavedCommand> list(
            @RequestParam(required = false) String folder,
            @RequestParam(required = false) String tags) {
        Set<String> tagSet = (tags == null || tags.isBlank())
                ? Collections.emptySet()
                : new HashSet<>(Arrays.asList(tags.split(",")));
        return service.list(folder, tagSet);
    }

    @GetMapping("/tags")
    public List<String> tags() {
        return service.allTags();
    }

    @PostMapping
    public SavedCommand create(@RequestBody CreateRequest body) throws IOException {
        return service.create(
                body.command(),
                body.label(),
                body.category(),
                body.folderId(),
                body.tags(),
                body.notes()
        );
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SavedCommand> update(@PathVariable String id, @RequestBody UpdateRequest body) throws IOException {
        Optional<SavedCommand> updated = service.update(
                id,
                body.label(),
                body.category(),
                body.folderId(),
                body.tags(),
                body.notes()
        );
        return updated.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws IOException {
        boolean ok = service.delete(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    public record CreateRequest(
            @NotBlank String command,
            String label,
            String category,
            String folderId,
            List<String> tags,
            String notes
    ) {}

    public record UpdateRequest(
            String label,
            String category,
            // folderId: pass empty string to clear; null to leave unchanged.
            String folderId,
            List<String> tags,
            String notes
    ) {}
}
