package com.smartcliweb.controller;

import com.smartcliweb.model.HistoryEntry;
import com.smartcliweb.service.HistoryService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    public List<HistoryEntry> list() {
        return historyService.list();
    }

    @PostMapping
    public HistoryEntry add(@RequestBody AddRequest body) throws IOException {
        return historyService.add(body.command(), body.category());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws IOException {
        boolean ok = historyService.delete(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clear() throws IOException {
        historyService.clear();
        return ResponseEntity.noContent().build();
    }

    public record AddRequest(@NotBlank String command, String category) {}
}
