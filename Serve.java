import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.*;
import java.util.*;

/**
 * Minimal static file server to serve the PassGuard frontend.
 * Uses only built-in Java classes — no dependencies needed.
 */
public class Serve {

    private static final int PORT = 3000;
    private static final Path ROOT = Paths.get("frontend").toAbsolutePath();

    private static final Map<String, String> MIME = new HashMap<>();

    static {
        MIME.put("html", "text/html; charset=utf-8");
        MIME.put("css",  "text/css; charset=utf-8");
        MIME.put("js",   "application/javascript; charset=utf-8");
        MIME.put("json", "application/json; charset=utf-8");
        MIME.put("png",  "image/png");
        MIME.put("ico",  "image/x-icon");
        MIME.put("svg",  "image/svg+xml");
        MIME.put("woff2","font/woff2");
    }

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // ── /api/validate — validation endpoint ────────────────────
        server.createContext("/api/validate", new HttpHandler() {
            @Override
            public void handle(HttpExchange ex) throws IOException {
                if (!ex.getRequestMethod().equalsIgnoreCase("POST")) {
                    respond(ex, 405, "application/json", "{\"error\":\"Method not allowed\"}");
                    return;
                }
                // Add CORS headers
                ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                ex.getResponseHeaders().add("Content-Type", "application/json");

                String body = new String(ex.getRequestBody().readAllBytes(), "UTF-8");
                String username = extractJson(body, "username");
                String password = extractJson(body, "password");

                String result = PasswordStrengthValidator.validateToJson(username, password);
                respond(ex, 200, "application/json", result);
            }
        });

        // ── /api/health ─────────────────────────────────────────────
        server.createContext("/api/health", ex -> {
            ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            String json = "{\"status\":\"healthy\",\"version\":\"1.0.0\",\"service\":\"PassGuard Java API\"}";
            respond(ex, 200, "application/json", json);
        });

        // ── /api/policy ─────────────────────────────────────────────
        server.createContext("/api/policy", ex -> {
            ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            String json = "{\"minLength\":12,\"requirements\":[\"At least 12 characters\",\"Uppercase letter\",\"Lowercase letter\",\"Digit\",\"Special character\",\"No username\",\"Not common password\",\"No repeated chars\",\"No sequential chars\"]}";
            respond(ex, 200, "application/json", json);
        });

        // ── Static files ─────────────────────────────────────────────
        server.createContext("/", ex -> {
            String path = ex.getRequestURI().getPath();
            if (path.equals("/")) path = "/index.html";

            Path file = ROOT.resolve(path.substring(1)).normalize();

            // Security: don't allow path traversal
            if (!file.startsWith(ROOT)) {
                respond(ex, 403, "text/plain", "Forbidden");
                return;
            }

            if (!Files.exists(file) || Files.isDirectory(file)) {
                // Fallback to index.html for SPA
                file = ROOT.resolve("index.html");
            }

            String ext = "";
            String fname = file.getFileName().toString();
            int dot = fname.lastIndexOf('.');
            if (dot > 0) ext = fname.substring(dot + 1);
            String mime = MIME.getOrDefault(ext, "application/octet-stream");

            byte[] bytes = Files.readAllBytes(file);
            ex.getResponseHeaders().add("Content-Type", mime);
            ex.getResponseHeaders().add("Cache-Control", "no-cache");
            ex.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
        });

        server.setExecutor(null);
        server.start();

        System.out.println("\n========================================");
        System.out.println("  PassGuard Server Running!");
        System.out.println("  Open: http://localhost:" + PORT);
        System.out.println("  API:  http://localhost:" + PORT + "/api/validate");
        System.out.println("  Press Ctrl+C to stop.");
        System.out.println("========================================\n");

        // Keep alive & open browser
        try {
            Runtime.getRuntime().exec("cmd /c start http://localhost:" + PORT);
        } catch (Exception ignored) {}
    }

    private static void respond(HttpExchange ex, int code, String mime, String body) throws IOException {
        byte[] bytes = body.getBytes("UTF-8");
        ex.getResponseHeaders().set("Content-Type", mime);
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    /** Naive JSON string field extractor — avoids external dependencies */
    private static String extractJson(String json, String key) {
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx < 0) return "";
        int colon = json.indexOf(':', idx + search.length());
        if (colon < 0) return "";
        int start = json.indexOf('"', colon + 1);
        if (start < 0) return "";
        start++;
        StringBuilder sb = new StringBuilder();
        for (int i = start; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '"' && (i == 0 || json.charAt(i-1) != '\\')) break;
            sb.append(c);
        }
        return sb.toString();
    }
}
