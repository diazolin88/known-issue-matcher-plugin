package com.example.knownissues;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/known-issues")
@CrossOrigin(origins = "*") // Allow all origins as per original server.js
public class KnownIssueController {

    private final KnownIssueRepository repository;

    @Autowired
    public KnownIssueController(KnownIssueRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<KnownIssue> getAllKnownIssues() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> addKnownIssue(@RequestBody Map<String, String> payload) {
        String regex = payload.get("regex");
        if (regex == null || regex.isEmpty()) {
            return ResponseEntity.badRequest().body("Regex is required");
        }

        KnownIssue knownIssue = new KnownIssue(regex);
        KnownIssue savedIssue = repository.save(knownIssue);

        // Return format matching original: { id: ..., regex_pattern: ... }
        // Although the entity has regexPattern (camelCase), Jackson will serialize it
        // as such.
        // If we want exact snake_case "regex_pattern" in JSON, we might need
        // @JsonProperty or a DTO.
        // Let's use a Map for the response to be safe and match the ID/regex_pattern
        // structure exactly if needed,
        // or just rely on the entity. The original returned { id: result.insertId,
        // regex_pattern: regex }.

        return ResponseEntity.status(HttpStatus.CREATED).body(savedIssue);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteKnownIssue(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
