package app;

public class TextData extends ExtractedData {
    private final String textValue;

    public TextData(String text) {
        this.textValue = text;
    }

    @Override
    protected String[] getTags() {
        return new String[] { "text" };
    }

    public String getText() {
        return this.textValue;
    }
}