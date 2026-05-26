package com.smartcliweb.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "smartcli-web")
public class SmartcliWebProperties {
    private String historyFile;
    private int maxHistory = 200;
    private String foldersFile;
    private String savedFile;
    private List<String> allowedOrigins = new ArrayList<>();

    public String getHistoryFile() { return historyFile; }
    public void setHistoryFile(String historyFile) { this.historyFile = historyFile; }

    public int getMaxHistory() { return maxHistory; }
    public void setMaxHistory(int maxHistory) { this.maxHistory = maxHistory; }

    public String getFoldersFile() { return foldersFile; }
    public void setFoldersFile(String foldersFile) { this.foldersFile = foldersFile; }

    public String getSavedFile() { return savedFile; }
    public void setSavedFile(String savedFile) { this.savedFile = savedFile; }

    public List<String> getAllowedOrigins() { return allowedOrigins; }
    public void setAllowedOrigins(List<String> allowedOrigins) { this.allowedOrigins = allowedOrigins; }
}
