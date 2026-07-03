import java.util.*;

public class PasswordStrengthValidator {

    private static final int MIN_LENGTH = 12;

    private static final Set<String> BANNED_PASSWORDS = new HashSet<>(Arrays.asList(
            "password", "password123", "admin", "welcome", "qwerty",
            "letmein", "iloveyou", "123456", "12345678", "abc123",
            "football", "monkey", "login", "superman", "batman",
            "master", "dragon", "princess", "passw0rd", "1q2w3e",
            "sunshine", "shadow", "123123", "111111", "000000",
            "password1", "123456789", "1234567890", "qwerty123",
            "hello", "trustno1", "654321", "solo", "starwars", "cheese"
    ));

    private static final String[] COMMON_SEQUENCES = {
            "abcdefghijklmnopqrstuvwxyz",
            "0123456789",
            "qwertyuiop",
            "asdfghjkl",
            "zxcvbnm",
            "zyxwvutsrqponmlkjihgfedcba",
            "9876543210",
            "poiuytrewq",
            "lkjhgfdsa",
            "mnbvcxz"
    };

    public static class ValidationResult {
        boolean valid;
        int score;
        String level;
        List<String> feedback = new ArrayList<>();
        // details flags
        boolean dLength, dUpper, dLower, dDigit, dSymbol;
        boolean dNotBanned, dNoUsername, dNoRepeated, dNoSequential, dNoCommonSeq;
        int entropy;
    }

    public static ValidationResult validate(String username, String password) {

        ValidationResult result = new ValidationResult();

        if (password == null || password.isEmpty()) {
            result.valid = false;
            result.feedback.add("Password cannot be empty.");
            result.level = "Very Weak";
            return result;
        }

        boolean hasUpper = false, hasLower = false, hasDigit = false, hasSymbol = false;
        boolean repeatedChars = false, sequentialChars = false;
        int repeatCount = 1;

        for (int i = 0; i < password.length(); i++) {
            char ch = password.charAt(i);
            if (Character.isUpperCase(ch))      hasUpper = true;
            else if (Character.isLowerCase(ch)) hasLower = true;
            else if (Character.isDigit(ch))     hasDigit = true;
            else if (!Character.isWhitespace(ch)) hasSymbol = true;

            if (i > 0) {
                char prev = password.charAt(i - 1);
                if (ch == prev) {
                    repeatCount++;
                    if (repeatCount >= 3) repeatedChars = true;
                } else {
                    repeatCount = 1;
                }
                if ((ch == prev + 1) || (ch == prev - 1)) {
                    if (i >= 2) {
                        char prev2 = password.charAt(i - 2);
                        if ((prev2 + 1 == prev && prev + 1 == ch)
                                || (prev2 - 1 == prev && prev - 1 == ch)) {
                            sequentialChars = true;
                        }
                    }
                }
            }
        }

        String lowerPassword = password.toLowerCase();
        String lowerUsername = (username == null ? "" : username.toLowerCase().trim());

        boolean lengthOk   = password.length() >= MIN_LENGTH;
        boolean notBanned   = !BANNED_PASSWORDS.contains(lowerPassword);
        boolean noUsername  = lowerUsername.isEmpty() || !lowerPassword.contains(lowerUsername);
        boolean noCommonSeq = true;

        for (String seq : COMMON_SEQUENCES) {
            if (seq.contains(lowerPassword) && lowerPassword.length() >= 3) {
                noCommonSeq = false;
                break;
            }
        }

        // Store detail flags
        result.dLength      = lengthOk;
        result.dUpper       = hasUpper;
        result.dLower       = hasLower;
        result.dDigit       = hasDigit;
        result.dSymbol      = hasSymbol;
        result.dNotBanned   = notBanned;
        result.dNoUsername  = noUsername;
        result.dNoRepeated  = !repeatedChars;
        result.dNoSequential= !sequentialChars;
        result.dNoCommonSeq = noCommonSeq;

        // Feedback
        if (!lengthOk)       result.feedback.add("Use at least " + MIN_LENGTH + " characters (currently " + password.length() + ").");
        if (!hasUpper)       result.feedback.add("Add at least one uppercase letter (A\u2013Z).");
        if (!hasLower)       result.feedback.add("Add at least one lowercase letter (a\u2013z).");
        if (!hasDigit)       result.feedback.add("Add at least one digit (0\u20139).");
        if (!hasSymbol)      result.feedback.add("Add at least one special character (!@#$%^&*...).");
        if (!noUsername)     result.feedback.add("Password should not contain the username.");
        if (!notBanned)      result.feedback.add("This password is too common. Choose something unique.");
        if (!noCommonSeq)    result.feedback.add("Password contains a common keyboard sequence.");
        if (repeatedChars)   result.feedback.add("Avoid repeated characters like 'aaa' or '111'.");
        if (sequentialChars) result.feedback.add("Avoid sequential characters like 'abcd' or '1234'.");

        // Score
        int score = 0;
        if (lengthOk)        score += 25;
        if (hasUpper)        score += 15;
        if (hasLower)        score += 15;
        if (hasDigit)        score += 15;
        if (hasSymbol)       score += 15;
        if (!repeatedChars)  score += 5;
        if (!sequentialChars) score += 5;
        if (noUsername)      score += 5;
        if (notBanned)       score += 5;
        if (password.length() >= 16) score = Math.min(score + 5, 100);
        if (password.length() >= 20) score = Math.min(score + 5, 100);
        if (noCommonSeq)     score = Math.min(score + 5, 100);
        score = Math.min(score, 100);

        result.score = score;
        result.level = strengthLevel(score);
        result.valid = result.feedback.isEmpty();

        // Entropy
        int pool = 0;
        if (hasLower) pool += 26;
        if (hasUpper) pool += 26;
        if (hasDigit) pool += 10;
        if (hasSymbol) pool += 32;
        if (pool > 0)
            result.entropy = (int) Math.round(password.length() * (Math.log(pool) / Math.log(2)));

        return result;
    }

    /** Returns validation result as a JSON string for the HTTP API */
    public static String validateToJson(String username, String password) {
        ValidationResult r = validate(username, password);

        StringBuilder fb = new StringBuilder("[");
        for (int i = 0; i < r.feedback.size(); i++) {
            if (i > 0) fb.append(",");
            fb.append("\"").append(escapeJson(r.feedback.get(i))).append("\"");
        }
        fb.append("]");

        return "{"
            + "\"valid\":"   + r.valid + ","
            + "\"score\":"   + r.score + ","
            + "\"level\":\""  + escapeJson(r.level) + "\","
            + "\"feedback\":" + fb + ","
            + "\"details\":{"
            +   "\"length\":"       + r.dLength      + ","
            +   "\"hasUpper\":"     + r.dUpper       + ","
            +   "\"hasLower\":"     + r.dLower       + ","
            +   "\"hasDigit\":"     + r.dDigit       + ","
            +   "\"hasSymbol\":"    + r.dSymbol      + ","
            +   "\"notBanned\":"    + r.dNotBanned   + ","
            +   "\"noUsername\":"   + r.dNoUsername  + ","
            +   "\"noRepeated\":"   + r.dNoRepeated  + ","
            +   "\"noSequential\":" + r.dNoSequential+ ","
            +   "\"noCommonSeq\":"  + r.dNoCommonSeq + ","
            +   "\"entropy\":"      + r.entropy
            + "}"
            + "}";
    }

    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r");
    }

    private static String strengthLevel(int score) {
        if (score >= 90) return "Very Strong";
        if (score >= 75) return "Strong";
        if (score >= 60) return "Medium";
        if (score >= 40) return "Weak";
        return "Very Weak";
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter Username: ");
        String username = scanner.nextLine();
        System.out.print("Enter Password: ");
        String password = scanner.nextLine();
        ValidationResult result = validate(username, password);
        System.out.println("\nValidation Result");
        System.out.println("----------------------");
        System.out.println("Valid Password : " + result.valid);
        System.out.println("Strength Score : " + result.score + "/100");
        System.out.println("Strength Level : " + result.level);
        if (!result.feedback.isEmpty()) {
            System.out.println("\nSuggestions:");
            for (String tip : result.feedback) System.out.println("- " + tip);
        } else {
            System.out.println("\nPassword satisfies the enterprise security policy.");
        }
        scanner.close();
    }
}
