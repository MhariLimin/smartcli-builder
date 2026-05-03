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
    private List<String> allowedOrigins = new ArrayList<>();

    public String getHistoryFile() { return historyFile; }
    public void setHistoryFile(String historyFile) { this.historyFile = historyFile; }

    public int getMaxHistory() { return maxHistory; }
    public void setMaxHistory(int maxHistory) { this.maxHistory = maxHistory; }

    public List<String> getAllowedOrigins() { return allowedOrigins; }
    public void setAllowedOrigins(List<String> allowedOrigins) { this.allowedOrigins = allowedOrigins; }
}
