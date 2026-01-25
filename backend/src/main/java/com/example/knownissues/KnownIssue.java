package com.example.knownissues;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.sql.Timestamp;

@Entity
@Table(name = "known_issues")
@Data
@NoArgsConstructor
public class KnownIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonProperty("regex_pattern")
    @Column(name = "regex_pattern", nullable = false)
    private String regexPattern;

    @Column(name = "created_at", insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private Timestamp createdAt;

    public KnownIssue(String regexPattern) {
        this.regexPattern = regexPattern;
    }
}
