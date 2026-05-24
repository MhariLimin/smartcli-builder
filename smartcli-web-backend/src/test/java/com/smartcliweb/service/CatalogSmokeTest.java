package com.smartcliweb.service;

import com.smartcliweb.model.CommandTemplate;
import com.smartcliweb.model.PlaceholderInfo;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.util.List;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Smoke check over the real classpath commands.json. Catches a malformed
 * template (stray angle bracket, unclosed placeholder, etc.) before it
 * silently corrupts suggestions or the placeholder form.
 *
 * Cheap: ~1700 templates × one regex scan + one parse pass.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CatalogSmokeTest {

    // A `<` followed by an identifier-like char (letter or `_`) is almost
    // certainly the start of a placeholder, so it must be closed by a `>`
    // somewhere after. Plain `<` followed by `/`, `&`, whitespace, etc. is a
    // shell redirect operator and not flagged. This pairs with
    // every_placeholder_parsesCleanly, which catches the inverse case
    // (regex matched but inner text is malformed).
    private static final Pattern UNCLOSED_PLACEHOLDER =
            Pattern.compile("<[a-zA-Z_][^>]*$");

    private final CommandCatalogService service = new CommandCatalogService();

    @BeforeAll
    void loadCatalog() throws Exception {
        service.load();
    }

    @Test
    void catalog_hasContent() {
        List<CommandTemplate> all = service.all();
        assertThat(all)
                .as("catalog should not be empty — commands.json missing or unreadable")
                .isNotEmpty();
        // Sanity threshold; the catalog should always have at least a few
        // hundred entries.
        assertThat(all.size()).isGreaterThan(500);
    }

    @Test
    void every_template_hasRequiredFields() {
        for (CommandTemplate t : service.all()) {
            assertThat(t.getCategory()).as("template missing category: %s", t.getTemplate())
                    .isNotBlank();
            assertThat(t.getTemplate()).as("template text is blank").isNotBlank();
            assertThat(t.getDescription()).as("template missing description: %s", t.getTemplate())
                    .isNotBlank();
        }
    }

    @Test
    void every_placeholder_parsesCleanly() {
        // For each template, placeholderInfos must succeed without throwing
        // and must produce one info per distinct slot. The result list mirrors
        // what /api/placeholders returns to the frontend.
        for (CommandTemplate t : service.all()) {
            String template = t.getTemplate();
            List<PlaceholderInfo> infos;
            try {
                infos = service.placeholderInfos(template);
            } catch (RuntimeException e) {
                throw new AssertionError(
                        "placeholderInfos threw on template: " + template, e);
            }
            for (PlaceholderInfo p : infos) {
                assertThat(p.getName()).as("blank name in template: %s", template).isNotBlank();
                assertThat(p.getSlot()).as("blank slot in template: %s", template).isNotBlank();
                assertThat(p.getSlot()).startsWith("<").endsWith(">");
            }
        }
    }

    @Test
    void no_template_hasUnclosedPlaceholder() {
        // Catch an unclosed slot like "kubectl get <namespace" — i.e. a `<`
        // that looks like a placeholder open with no matching `>` later.
        // Shell redirect operators (`</dev/null`, `< <token-file>`) don't
        // trip because the `<` is followed by `/`, `&`, or whitespace
        // rather than an identifier char.
        for (CommandTemplate t : service.all()) {
            String template = t.getTemplate();
            assertThat(UNCLOSED_PLACEHOLDER.matcher(template).find())
                    .as("unclosed placeholder in template: %s", template)
                    .isFalse();
        }
    }
}
