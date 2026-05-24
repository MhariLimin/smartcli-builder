package com.smartcliweb.service;

import com.smartcliweb.model.PlaceholderInfo;
import com.smartcliweb.model.Suggestion;
import com.smartcliweb.model.SuggestionKind;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins the load-bearing UX invariant from .claude/CLAUDE.md:
 * "full prefix-matches first, then EXTENSION, then TEMPLATE."
 * The manual `kubectl `/`docker `/`git ` verification step lives here now.
 *
 * Also covers typed-placeholder parsing through placeholderInfos(), since
 * parseSlot() is private and the previous grep-found regression
 * (`<key=value>` interpreted as name="key"/default="value") had no
 * regression test.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CommandCatalogServiceTest {

    private final CommandCatalogService service = new CommandCatalogService();

    @BeforeAll
    void loadCatalog() throws Exception {
        service.load();
    }

    // ---- suggestion ordering -----------------------------------------------

    @Test
    void kubectlSpace_returnsExtensionsBeforeTemplates() {
        List<Suggestion> result = service.suggest("kubectl ", 30);
        assertThat(result).isNotEmpty();
        int firstTemplateIdx = indexOfFirstKind(result, SuggestionKind.TEMPLATE);
        int lastExtensionIdx = indexOfLastKind(result, SuggestionKind.EXTENSION);
        if (firstTemplateIdx >= 0 && lastExtensionIdx >= 0) {
            assertThat(lastExtensionIdx)
                    .as("EXTENSIONs must come before TEMPLATEs for 'kubectl '")
                    .isLessThan(firstTemplateIdx);
        }
    }

    @Test
    void dockerSpace_returnsExtensionsBeforeTemplates() {
        List<Suggestion> result = service.suggest("docker ", 30);
        assertThat(result).isNotEmpty();
        int firstTemplateIdx = indexOfFirstKind(result, SuggestionKind.TEMPLATE);
        int lastExtensionIdx = indexOfLastKind(result, SuggestionKind.EXTENSION);
        if (firstTemplateIdx >= 0 && lastExtensionIdx >= 0) {
            assertThat(lastExtensionIdx).isLessThan(firstTemplateIdx);
        }
    }

    @Test
    void gitSpace_returnsExtensionsBeforeTemplates() {
        List<Suggestion> result = service.suggest("git ", 30);
        assertThat(result).isNotEmpty();
        int firstTemplateIdx = indexOfFirstKind(result, SuggestionKind.TEMPLATE);
        int lastExtensionIdx = indexOfLastKind(result, SuggestionKind.EXTENSION);
        if (firstTemplateIdx >= 0 && lastExtensionIdx >= 0) {
            assertThat(lastExtensionIdx).isLessThan(firstTemplateIdx);
        }
    }

    @Test
    void empty_returnsDistinctFirstTokens() {
        List<Suggestion> result = service.suggest("", 50);
        assertThat(result).isNotEmpty();
        // First-token suggestions like "kubectl", "docker", "git" should be present.
        List<String> texts = result.stream().map(Suggestion::getText).toList();
        assertThat(texts).contains("kubectl", "docker", "git");
    }

    @Test
    void placeholdersMatchAsWildcards_inCommittedPrefix() {
        // After the user commits a value into a placeholder slot (signalled
        // by the trailing space — same convention the frontend uses), the
        // suggest() prefix matcher treats the next template token as a
        // wildcard and surfaces further extensions. Wildcard handling only
        // covers *committed* tokens — the still-being-typed partial token
        // compares textually, so the variant without a trailing space
        // returns nothing. That divergence is intentional and tracked
        // separately from this test.
        List<Suggestion> result = service.suggest("kubectl get pods -n kube-system ", 50);
        assertThat(result)
                .as("committed placeholder value should still extend the template")
                .anySatisfy(s -> assertThat(s.getText()).contains("kubectl get pods -n"));
    }

    @Test
    void limitParameter_isRespected() {
        List<Suggestion> result = service.suggest("kubectl ", 5);
        assertThat(result).hasSizeLessThanOrEqualTo(5);
    }

    // ---- placeholder parsing (regression coverage) -------------------------

    @Test
    void legacy_keyEqualsValue_isVerbatimName_notDefault() {
        // <key=value> historically meant "the placeholder named key=value"
        // (used by kubectl --env=<key=value>). The typed grammar does NOT
        // recognize `=default` without `:type` or `|enum`, so the parser must
        // leave the `=` inside the name. Otherwise the prior regression
        // returns: PlaceholderForm prefills "value" and clobbers the slot.
        List<PlaceholderInfo> infos = service.placeholderInfos(
                "kubectl run pod --env=<key=value>");
        assertThat(infos).hasSize(1);
        PlaceholderInfo p = infos.get(0);
        assertThat(p.getName()).isEqualTo("key=value");
        assertThat(p.getType()).isNull();
        assertThat(p.getDefaultValue()).isNull();
        assertThat(p.getSlot()).isEqualTo("<key=value>");
    }

    @Test
    void typed_int_withDefault_parses() {
        List<PlaceholderInfo> infos = service.placeholderInfos("ssh -p <port:int=22> host");
        assertThat(infos).hasSize(1);
        PlaceholderInfo p = infos.get(0);
        assertThat(p.getName()).isEqualTo("port");
        assertThat(p.getType()).isEqualTo("int");
        assertThat(p.getDefaultValue()).isEqualTo("22");
        assertThat(p.getSlot()).isEqualTo("<port:int=22>");
    }

    @Test
    void typed_enum_withDefault_parses() {
        List<PlaceholderInfo> infos = service.placeholderInfos(
                "kubectl get -n <env|prod,staging,dev=dev>");
        assertThat(infos).hasSize(1);
        PlaceholderInfo p = infos.get(0);
        assertThat(p.getName()).isEqualTo("env");
        assertThat(p.getType()).isEqualTo("enum");
        assertThat(p.getEnumOptions()).containsExactly("prod", "staging", "dev");
        assertThat(p.getDefaultValue()).isEqualTo("dev");
    }

    @Test
    void typed_bool_parses() {
        List<PlaceholderInfo> infos = service.placeholderInfos(
                "docker run --pull=<always:bool=false> img");
        assertThat(infos).hasSize(1);
        assertThat(infos.get(0).getType()).isEqualTo("bool");
        assertThat(infos.get(0).getDefaultValue()).isEqualTo("false");
    }

    @Test
    void untyped_legacy_name_parses() {
        // Every existing <name> entry must keep working unchanged.
        List<PlaceholderInfo> infos = service.placeholderInfos(
                "kubectl get pods -n <namespace>");
        assertThat(infos).hasSize(1);
        PlaceholderInfo p = infos.get(0);
        assertThat(p.getName()).isEqualTo("namespace");
        assertThat(p.getType()).isNull();
        assertThat(p.getEnumOptions()).isNull();
        assertThat(p.getDefaultValue()).isNull();
        assertThat(p.getSlot()).isEqualTo("<namespace>");
        // The legacy hintFor map should still pick up "namespace".
        assertThat(p.getHint()).contains("kube-system");
    }

    @Test
    void duplicateNames_dedupeOnFirstOccurrence() {
        List<PlaceholderInfo> infos = service.placeholderInfos(
                "ssh -L <port>:localhost:<port> <host>");
        // Same name appears twice; placeholderInfos dedupes by name.
        assertThat(infos).extracting(PlaceholderInfo::getName)
                .containsExactly("port", "host");
    }

    @Test
    void extractPlaceholders_returnsNamesNotRawInner() {
        // Backwards-compatibility check: the public extractPlaceholders API
        // must still return just names even when slots use typed grammar.
        List<String> names = service.extractPlaceholders(
                "ssh -p <port:int=22> <user>@<host>");
        assertThat(names).containsExactly("port", "user", "host");
    }

    // ---- helpers -----------------------------------------------------------

    private int indexOfFirstKind(List<Suggestion> list, SuggestionKind kind) {
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).getKind() == kind) return i;
        }
        return -1;
    }

    private int indexOfLastKind(List<Suggestion> list, SuggestionKind kind) {
        int found = -1;
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).getKind() == kind) found = i;
        }
        return found;
    }
}
