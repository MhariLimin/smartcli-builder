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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc smoke tests for the history REST surface. Uses
 * @DynamicPropertySource to point the history file at a temp directory so
 * the real ~/.smartcli-web/history.json isn't touched.
 */
@SpringBootTest
@AutoConfigureMockMvc
class HistoryControllerTest {

    @TempDir
    static Path tmp;

    @DynamicPropertySource
    static void overrideHistoryFile(DynamicPropertyRegistry r) {
        r.add("smartcli-web.history-file",
                () -> tmp.resolve("history.json").toString());
    }

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    @BeforeEach
    void wipeHistory() throws Exception {
        // Clean slate per test so order assertions are stable.
        mvc.perform(delete("/api/history")).andExpect(status().isNoContent());
        // The temp file may persist between tests inside a single JVM run;
        // make sure it's empty too.
        Path file = tmp.resolve("history.json");
        if (Files.exists(file)) Files.writeString(file, "[]");
    }

    @Test
    void post_addsEntry_andList_returnsIt() throws Exception {
        String body = "{\"command\":\"git status\",\"category\":\"git\"}";
        mvc.perform(post("/api/history")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.command").value("git status"))
                .andExpect(jsonPath("$.category").value("git"))
                .andExpect(jsonPath("$.id").isNotEmpty());

        mvc.perform(get("/api/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].command").value("git status"));
    }

    @Test
    void deleteUnknownId_returns404() throws Exception {
        mvc.perform(delete("/api/history/{id}", "not-a-real-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteById_removesEntry() throws Exception {
        String body = "{\"command\":\"git diff\",\"category\":\"git\"}";
        MvcResult posted = mvc.perform(post("/api/history")
                        .contentType("application/json").content(body))
                .andExpect(status().isOk()).andReturn();
        JsonNode node = mapper.readTree(posted.getResponse().getContentAsString());
        String id = node.get("id").asText();

        mvc.perform(delete("/api/history/{id}", id))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void clearAll_returns204_andEmptiesList() throws Exception {
        mvc.perform(post("/api/history").contentType("application/json")
                .content("{\"command\":\"a\",\"category\":\"x\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/history").contentType("application/json")
                .content("{\"command\":\"b\",\"category\":\"x\"}")).andExpect(status().isOk());

        mvc.perform(delete("/api/history")).andExpect(status().isNoContent());
        mvc.perform(get("/api/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void suggestions_endpoint_works() throws Exception {
        MvcResult result = mvc.perform(get("/api/suggestions").param("q", "kubectl ").param("limit", "5"))
                .andExpect(status().isOk()).andReturn();
        assertThat(result.getResponse().getContentAsString()).contains("kubectl");
    }

    @Test
    void placeholders_endpoint_returnsTypedSlot() throws Exception {
        mvc.perform(get("/api/placeholders").param("template", "ssh -p <port:int=22> <host>"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("port"))
                .andExpect(jsonPath("$[0].type").value("int"))
                .andExpect(jsonPath("$[0].defaultValue").value("22"))
                .andExpect(jsonPath("$[0].slot").value("<port:int=22>"));
    }

    @Test
    void categories_endpoint_returnsSortedList() throws Exception {
        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@=='kubectl')]").exists());
    }
}
