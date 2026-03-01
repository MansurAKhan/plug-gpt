import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

public class AcademicUtils {
    private static int countWords(String text) {
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return 0;
        }
        return trimmed.split("\\s+").length;
    }

    private static int countSentences(String text) {
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (int i = 0; i < trimmed.length(); i++) {
            char ch = trimmed.charAt(i);
            if (ch == '.' || ch == '!' || ch == '?') {
                count++;
            }
        }
        return count == 0 ? 1 : count;
    }

    private static String escapeJson(String text) {
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "");
    }

    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(
            new InputStreamReader(System.in, StandardCharsets.UTF_8)
        );
        String input = reader.lines().collect(Collectors.joining("\n"));

        int chars = input.length();
        int words = countWords(input);
        int sentences = countSentences(input);

        String json = "{" +
            "\"characters\":" + chars + "," +
            "\"words\":" + words + "," +
            "\"sentences\":" + sentences + "," +
            "\"preview\":\"" + escapeJson(input.length() > 120 ? input.substring(0, 120) : input) + "\"" +
            "}";

        System.out.println(json);
    }
}
