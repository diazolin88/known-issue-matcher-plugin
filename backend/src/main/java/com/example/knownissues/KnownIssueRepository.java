package com.example.knownissues;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KnownIssueRepository extends JpaRepository<KnownIssue, Long> {
}
