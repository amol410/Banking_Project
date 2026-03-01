package com.banking.studentbank.service;

import com.banking.studentbank.dto.AuditLogResponse;
import com.banking.studentbank.model.AuditLog;
import com.banking.studentbank.model.AuditStatus;
import com.banking.studentbank.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(String username, String action, String description, String ipAddress, AuditStatus status) {
        AuditLog log = AuditLog.builder()
                .username(username)
                .action(action)
                .description(description)
                .ipAddress(ipAddress)
                .status(status)
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLogResponse> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable).map(this::mapToResponse);
    }

    public Page<AuditLogResponse> getLogsByUsername(String username, Pageable pageable) {
        return auditLogRepository.findByUsername(username, pageable).map(this::mapToResponse);
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .username(log.getUsername())
                .action(log.getAction())
                .description(log.getDescription())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .status(log.getStatus())
                .build();
    }
}
