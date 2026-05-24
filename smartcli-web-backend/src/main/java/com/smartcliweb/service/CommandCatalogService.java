package com.smartcliweb.service;

import com.smartcliweb.model.CommandTemplate;
import com.smartcliweb.model.PlaceholderInfo;
import com.smartcliweb.model.Suggestion;
import com.smartcliweb.model.SuggestionKind;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CommandCatalogService {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("<([^>]+)>");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    private final List<CommandTemplate> templates = new ArrayList<>();

    @PostConstruct
    public void load() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream in = new ClassPathResource("commands.json").getInputStream()) {
            JsonNode root = mapper.readTree(in);
            JsonNode arr = root.get("commands");
            if (arr != null && arr.isArray()) {
                for (JsonNode node : arr) {
                    CommandTemplate t = mapper.treeToValue(node, CommandTemplate.class);
                    templates.add(t);
                }
            }
        }
    }

    public List<CommandTemplate> all() {
        return Collections.unmodifiableList(templates);
    }

    /**
     * Suggest next-token extensions based on the user's typed prefix.
     *
     * If the user typed "kubectl get", return distinct next-tokens ("pods", "deployments", ...).
     * If the typed text is empty, return distinct first tokens ("kubectl", "docker", ...).
     * If a token has no further extensions, return matching full templates instead.
     */
    public List<Suggestion> suggest(String typed, int limit) {
        String prefix = typed == null ? "" : typed.trim();
        List<String> typedTokens = tokenize(prefix);
        boolean trailingSpace = typed != null && !typed.isEmpty()
                && Character.isWhitespace(typed.charAt(typed.length() - 1));

        // Partial token at the end (still being typed) — only when no trailing space.
        String partial = (!trailingSpace && !typedTokens.isEmpty())
                ? typedTokens.get(typedTokens.size() - 1) : "";
        List<String> committed = (!trailingSpace && !typedTokens.isEmpty())
                ? typedTokens.subList(0, typedTokens.size() - 1) : typedTokens;

        // 1. Find templates whose tokens start with the committed prefix.
        List<CommandTemplate> matching = templates.stream()
                .filter(t -> startsWith(tokenize(t.getTemplate()), committed))
                .collect(Collectors.toList());

        if (matching.isEmpty()) {
            return List.of();
        }

        // 2. Compute the next-token set (the token at index `committed.size()` in each template).
        // For a token like "<placeholder>" we treat it as a single suggestion-token.
        Map<String, Suggestion> nextTokenMap = new LinkedHashMap<>();
        List<Suggestion> fullTemplateMatches = new ArrayList<>();

        for (CommandTemplate t : matching) {
            List<String> tTokens = tokenize(t.getTemplate());
            if (tTokens.size() == committed.size()) {
                // The template is fully matched; no further tokens.
                fullTemplateMatches.add(toTemplateSuggestion(t));
                continue;
            }
            String next = tTokens.get(committed.size());
            if (!partial.isEmpty() && !next.toLowerCase().startsWith(partial.toLowerCase())) {
                continue;
            }
            // Build the partial command-so-far ending at this next token.
            String soFar = String.join(" ", tTokens.subList(0, committed.size() + 1));
            nextTokenMap.computeIfAbsent(soFar, k -> {
                String desc = next.startsWith("<") && next.endsWith(">")
                        ? "Provide a value for " + next
                        : "Continue with: " + next;
                List<String> placeholders = extractPlaceholders(soFar);
                return new Suggestion(soFar, desc, t.getCategory(), placeholders,
                        SuggestionKind.EXTENSION);
            });
        }

        List<Suggestion> result = new ArrayList<>(nextTokenMap.values());

        // 3. Also add matching full templates (helpful when many tokens still differ — gives the
        //    user a way to jump straight to a complete template).
        for (CommandTemplate t : matching) {
            List<String> tTokens = tokenize(t.getTemplate());
            if (tTokens.size() > committed.size()) {
                if (!partial.isEmpty()) {
                    String next = tTokens.get(committed.size());
                    if (!next.toLowerCase().contains(partial.toLowerCase())) {
                        continue;
                    }
                }
                result.add(toTemplateSuggestion(t));
            }
        }

        // Full matches first, then extensions (already added above in mixed order).
        // Reorder so EXTENSIONs come first and TEMPLATEs after.
        result.sort(Comparator.comparing(s -> s.getKind() == SuggestionKind.EXTENSION ? 0 : 1));

        if (!fullTemplateMatches.isEmpty()) {
            result.addAll(0, fullTemplateMatches);
        }

        if (limit > 0 && result.size() > limit) {
            return result.subList(0, limit);
        }
        return result;
    }

    private Suggestion toTemplateSuggestion(CommandTemplate t) {
        return new Suggestion(
                t.getTemplate(),
                t.getDescription(),
                t.getCategory(),
                extractPlaceholders(t.getTemplate()),
                SuggestionKind.TEMPLATE
        );
    }

    /**
     * Extract placeholder names from a template, preserving order, removing duplicates.
     * Names only (no type/enum/default) — see placeholderInfos() for the full parse.
     */
    public List<String> extractPlaceholders(String template) {
        if (template == null) return List.of();
        Matcher m = PLACEHOLDER_PATTERN.matcher(template);
        LinkedHashSet<String> names = new LinkedHashSet<>();
        while (m.find()) {
            names.add(parseSlot(m.group(1)).name);
        }
        return new ArrayList<>(names);
    }

    /**
     * Build PlaceholderInfo entries with friendly labels, hints, and the parsed
     * type / enum / default carried by the typed-placeholder grammar.
     */
    public List<PlaceholderInfo> placeholderInfos(String template) {
        if (template == null) return List.of();
        Matcher m = PLACEHOLDER_PATTERN.matcher(template);
        Map<String, PlaceholderInfo> byName = new LinkedHashMap<>();
        while (m.find()) {
            String fullSlot = m.group(0);
            ParsedSlot p = parseSlot(m.group(1));
            // Dedupe by name; the first occurrence wins for type/enum/default.
            byName.computeIfAbsent(p.name, n -> new PlaceholderInfo(
                    n,
                    humanizeLabel(n),
                    hintFor(n),
                    p.type,
                    p.enumOptions,
                    p.defaultValue,
                    fullSlot
            ));
        }
        return new ArrayList<>(byName.values());
    }

    // ---- Typed-placeholder grammar --------------------------------------------------
    //
    // Slot grammar (inside the angle brackets):
    //   name
    //   name : type
    //   name : type = default
    //   name | opt1, opt2, opt3
    //   name | opt1, opt2, opt3 = optN
    // Whitespace around `:` `|` `=` `,` is permitted for catalog readability
    // and stripped during parse.

    private static final class ParsedSlot {
        final String name;
        final String type;             // null, "int", "float", "string", "bool", "path", "url", "enum"
        final List<String> enumOptions;
        final String defaultValue;
        ParsedSlot(String name, String type, List<String> enumOptions, String defaultValue) {
            this.name = name;
            this.type = type;
            this.enumOptions = enumOptions;
            this.defaultValue = defaultValue;
        }
    }

    private ParsedSlot parseSlot(String inner) {
        String s = inner == null ? "" : inner.trim();
        int pipe = s.indexOf('|');
        int colon = s.indexOf(':');

        // The grammar only allows `=default` AFTER `:type` or `|enum`. Legacy
        // slots like `<key=value>` carry the `=` in the name itself and must
        // stay verbatim — otherwise they'd reinterpret as `{name:"key",
        // default:"value"}` and break existing catalog entries.
        if (pipe < 0 && colon < 0) {
            return new ParsedSlot(s, null, null, null);
        }

        String defaultValue = null;
        int sep = (pipe >= 0) ? pipe : colon;
        int eq = s.indexOf('=', sep + 1);
        if (eq >= 0) {
            defaultValue = s.substring(eq + 1).trim();
            s = s.substring(0, eq).trim();
        }

        if (pipe >= 0) {
            String name = s.substring(0, pipe).trim();
            List<String> opts = Arrays.stream(s.substring(pipe + 1).split(","))
                    .map(String::trim)
                    .filter(x -> !x.isEmpty())
                    .collect(Collectors.toList());
            return new ParsedSlot(name, "enum", opts, defaultValue);
        }
        // colon >= 0
        String name = s.substring(0, colon).trim();
        String type = s.substring(colon + 1).trim().toLowerCase();
        return new ParsedSlot(name, type, null, defaultValue);
    }

    private String humanizeLabel(String name) {
        String s = name.replace('-', ' ').replace('_', ' ');
        if (s.isEmpty()) return name;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private String hintFor(String name) {
        String n = name.toLowerCase();
        if (n.contains("namespace")) return "e.g. default, kube-system";
        if (n.contains("pod-name") || n.equals("pod")) return "e.g. my-app-0, my-app-7c9f8";
        if (n.contains("service") || n.equals("svc")) return "e.g. my-service, my-app-headless";
        if (n.contains("container")) return "container name or ID";
        if (n.contains("image")) return "e.g. nginx:1.25, registry.example.com/team/app:1.0";
        if (n.contains("tag")) return "e.g. 1.0.0, latest";
        if (n.contains("registry")) return "registry hostname (e.g. registry.example.com)";
        if (n.contains("project")) return "project name";
        if (n.contains("repo") || n.contains("repository")) return "repository name";
        if (n.contains("branch")) return "e.g. main, develop";
        if (n.contains("file") || n.contains("path")) return "absolute or relative path";
        if (n.contains("dir") || n.contains("directory")) return "directory path";
        if (n.contains("port")) return "TCP/UDP port number";
        if (n.contains("host")) return "hostname or IP";
        if (n.contains("user")) return "username";
        if (n.contains("password") || n.contains("secret")) return "credential value";
        if (n.contains("topic")) return "Kafka topic name";
        if (n.contains("broker") || n.contains("bootstrap")) return "e.g. localhost:9092";
        if (n.contains("realm")) return "Keycloak realm name";
        if (n.contains("role")) return "Keycloak role name";
        if (n.contains("group")) return "consumer group / linux group";
        if (n.contains("cluster")) return "cluster name";
        if (n.contains("label")) return "e.g. app=my-app";
        if (n.contains("count") || n.contains("replicas") || n.contains("partitions")) return "integer";
        if (n.contains("days") || n.contains("validity")) return "number of days";
        if (n.contains("seconds") || n.contains("duration")) return "e.g. 60s, 5m";
        if (n.contains("query")) return "SQL or shell query";
        if (n.contains("alias")) return "keystore alias";
        if (n.contains("keystore")) return "keystore file path";
        if (n.contains("cert")) return "certificate file path";
        if (n.contains("url")) return "full URL";
        if (n.contains("email")) return "email address";
        if (n.contains("message")) return "message text";
        if (n.contains("commit")) return "commit hash";
        if (n.contains("tag-name")) return "git tag name";
        if (n.contains("digest")) return "sha256:..." ;
        return "value";
    }

    private List<String> tokenize(String s) {
        if (s == null || s.isBlank()) return List.of();
        return Arrays.stream(WHITESPACE.split(s.trim()))
                .filter(x -> !x.isEmpty())
                .collect(Collectors.toList());
    }

    private boolean startsWith(List<String> sequence, List<String> prefix) {
        if (prefix.size() > sequence.size()) return false;
        for (int i = 0; i < prefix.size(); i++) {
            String a = sequence.get(i);
            String b = prefix.get(i);
            if (a.startsWith("<") && a.endsWith(">")) continue; // placeholders match anything
            if (!a.equalsIgnoreCase(b)) return false;
        }
        return true;
    }
}
