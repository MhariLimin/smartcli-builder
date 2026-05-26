package com.smartcliweb.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc smoke tests for the /api/folders and /api/saved surfaces.
 * Single test class so the Spring context boots once for both controllers.
 * Uses @DynamicPropertySource to keep the real ~/.smartcli-web/ untouched.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SavedAndFolderControllerTest {

    @TempDir
    static Path tmp;

    @DynamicPropertySource
    static void overrideFiles(DynamicPropertyRegistry r) {
        r.add("smartcli-web.folders-file", () -> tmp.resolve("folders.json").toString());
        r.add("smartcli-web.saved-file",   () -> tmp.resolve("saved.json").toString());
    }

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    @BeforeEach
    void wipe() throws Exception {
        // Empty both stores between tests so order / count assertions stay stable.
        Path folders = tmp.resolve("folders.json");
        Path saved = tmp.resolve("saved.json");
        Files.writeString(folders, "[]");
        Files.writeString(saved, "[]");
        // Reload by deleting through the controller is not possible (the
        // service caches the parsed list in-memory). Tests therefore rely on
        // the per-test @SpringBootTest context — the cache persists across
        // tests within this class. Each test starts with whatever the
        // previous test left, so each one explicitly creates fresh rows.
    }

    @Test
    void createFolder_thenList_andRename_andDelete() throws Exception {
        // Create
        MvcResult result = mvc.perform(post("/api/folders").contentType("application/json")
                        .content("{\"name\":\"Kafka prod\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Kafka prod"))
                .andReturn();
        String id = mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // List contains it
        mvc.perform(get("/api/folders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + id + "')]").exists());

        // Rename
        mvc.perform(patch("/api/folders/{id}", id).contentType("application/json")
                        .content("{\"name\":\"Kafka prod (renamed)\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Kafka prod (renamed)"));

        // Delete
        mvc.perform(delete("/api/folders/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/folders"))
                .andExpect(jsonPath("$[?(@.id=='" + id + "')]").doesNotExist());
    }

    @Test
    void renameUnknownFolder_returns404() throws Exception {
        mvc.perform(patch("/api/folders/{id}", "not-a-real-id").contentType("application/json")
                        .content("{\"name\":\"x\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteFolder_cascadesAndDetachesSavedCommands() throws Exception {
        // Create folder and a saved row in it.
        MvcResult fResult = mvc.perform(post("/api/folders").contentType("application/json")
                        .content("{\"name\":\"to delete\"}"))
                .andExpect(status().isOk()).andReturn();
        String folderId = mapper.readTree(fResult.getResponse().getContentAsString()).get("id").asText();

        String savedBody = "{\"command\":\"git status\",\"folderId\":\"" + folderId + "\"}";
        MvcResult sResult = mvc.perform(post("/api/saved").contentType("application/json")
                        .content(savedBody))
                .andExpect(status().isOk()).andReturn();
        String savedId = mapper.readTree(sResult.getResponse().getContentAsString()).get("id").asText();

        // Delete the folder
        mvc.perform(delete("/api/folders/{id}", folderId)).andExpect(status().isNoContent());

        // Saved row survives but its folderId is now null.
        mvc.perform(get("/api/saved").param("folder", "uncategorized"))
                .andExpect(jsonPath("$[?(@.id=='" + savedId + "')]").exists());
    }

    @Test
    void createSaved_thenList_filterByFolder_patch_andDelete() throws Exception {
        // Make a folder to attach to.
        String fId = mapper.readTree(
                mvc.perform(post("/api/folders").contentType("application/json")
                        .content("{\"name\":\"box\"}")).andReturn().getResponse().getContentAsString()
        ).get("id").asText();

        // Create
        String body = "{\"command\":\"docker ps\",\"label\":\"List running\","
                + "\"category\":\"docker\",\"folderId\":\"" + fId + "\","
                + "\"tags\":[\"docker\",\"daily\"],\"notes\":\"useful note\"}";
        String json = mvc.perform(post("/api/saved").contentType("application/json").content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.command").value("docker ps"))
                .andExpect(jsonPath("$.label").value("List running"))
                .andExpect(jsonPath("$.tags.length()").value(2))
                .andReturn().getResponse().getContentAsString();
        String id = mapper.readTree(json).get("id").asText();

        // List filtered by folder includes it
        mvc.perform(get("/api/saved").param("folder", fId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + id + "')]").exists());

        // Patch — change label only; tags / folder untouched
        mvc.perform(patch("/api/saved/{id}", id).contentType("application/json")
                        .content("{\"label\":\"new label\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("new label"))
                .andExpect(jsonPath("$.tags.length()").value(2));

        // Delete
        mvc.perform(delete("/api/saved/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/saved").param("folder", fId))
                .andExpect(jsonPath("$[?(@.id=='" + id + "')]").doesNotExist());
    }

    @Test
    void deleteSavedUnknown_returns404() throws Exception {
        mvc.perform(delete("/api/saved/{id}", "not-a-real-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    void tagsEndpoint_returnsDistinctTags() throws Exception {
        // Two saved rows sharing one tag, plus one unique tag.
        mvc.perform(post("/api/saved").contentType("application/json")
                .content("{\"command\":\"a\",\"tags\":[\"x\",\"y\"]}")).andExpect(status().isOk());
        mvc.perform(post("/api/saved").contentType("application/json")
                .content("{\"command\":\"b\",\"tags\":[\"y\",\"z\"]}")).andExpect(status().isOk());
        mvc.perform(get("/api/saved/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@=='x')]").exists())
                .andExpect(jsonPath("$[?(@=='y')]").exists())
                .andExpect(jsonPath("$[?(@=='z')]").exists());
    }
}
