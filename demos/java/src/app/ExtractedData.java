package app;

import java.util.HashMap;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public abstract class ExtractedData {
    public HashMap<String, Boolean> getKind() {
        HashMap<String, Boolean> m = new HashMap<>();
        for (String s : getTags()) {
            m.put(s, true);
        }
        return m;
    }

    @JsonIgnore
    protected abstract String[] getTags();

    @Override
    public String toString() {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            String val = objectMapper.writeValueAsString(this);
            return val;
        } catch (JsonProcessingException e) {
            return "JsonProcessingException";
        }
    }
}
