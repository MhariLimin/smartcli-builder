package com.smartcliweb.controller;

import com.smartcliweb.model.CommandTemplate;
import com.smartcliweb.model.PlaceholderInfo;
import com.smartcliweb.model.Suggestion;
import com.smartcliweb.service.CommandCatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class SuggestionController {

    private final CommandCatalogService catalog;

    public SuggestionController(CommandCatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/suggestions")
    public List<Suggestion> suggestions(@RequestParam(name = "q", required = false) String q,
                                        @RequestParam(name = "limit", defaultValue = "30") int limit) {
        return catalog.suggest(q, limit);
    }

    @GetMapping("/placeholders")
    public List<PlaceholderInfo> placeholders(@RequestParam(name = "template") String template) {
        return catalog.placeholderInfos(template);
    }

    @GetMapping("/categories")
    public List<String> categories() {
        Set<String> set = new TreeSet<>();
        for (CommandTemplate t : catalog.all()) set.add(t.getCategory());
        return set.stream().toList();
    }

    @GetMapping("/templates")
    public List<CommandTemplate> templates(@RequestParam(name = "category", required = false) String category) {
        if (category == null || category.isBlank()) return catalog.all();
        return catalog.all().stream()
                .filter(t -> category.equalsIgnoreCase(t.getCategory()))
                .collect(Collectors.toList());
    }
}
