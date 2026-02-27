package com.examly.springapp.controller;

import com.examly.springapp.model.ClaimDocument;
import com.examly.springapp.service.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class DocumentController {
    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/claims/{claimId}/documents")
    public ResponseEntity<ClaimDocument> uploadFile(@PathVariable Long claimId,
            @RequestParam("file") MultipartFile file) {
        ClaimDocument doc = fileStorageService.storeFile(file, claimId);
        // Manual fraud detection - triggered by user via separate endpoint
        return ResponseEntity.ok(doc);
    }

    @GetMapping("/claims/{claimId}/documents")
    public List<ClaimDocument> getDocuments(@PathVariable Long claimId) {
        return fileStorageService.getDocumentsByClaim(claimId);
    }

    @GetMapping("/documents/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {
        Resource resource = fileStorageService.loadFileAsResource(fileName);
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            // Fallback
        }

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
