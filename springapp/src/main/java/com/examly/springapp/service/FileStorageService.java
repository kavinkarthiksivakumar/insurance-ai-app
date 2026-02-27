package com.examly.springapp.service;

import com.examly.springapp.model.Claim;
import com.examly.springapp.model.ClaimDocument;
import com.examly.springapp.repository.ClaimDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import com.examly.springapp.dto.FraudAnalysisDTO;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.List;

@Service
public class FileStorageService {
    private final Path fileStorageLocation;

    @Autowired
    private ClaimDocumentRepository documentRepository;

    @Autowired
    private ClaimService claimService;

    @Autowired
    private FraudService fraudService;

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public ClaimDocument storeFile(MultipartFile file, Long claimId) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        try {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        } catch (Exception e) {
            fileExtension = "";
        }

        String newFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            if (newFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + newFileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Claim claim = claimService.getClaimById(claimId);
            String fileUrl = "/api/documents/" + newFileName;

            ClaimDocument doc = new ClaimDocument(claim, originalFileName, fileUrl, file.getContentType());
            return documentRepository.save(doc);

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + newFileName + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("File not found " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found " + fileName, ex);
        }
    }

    public void analyzeFraudForDocument(ClaimDocument document) {
        try {
            // Get the physical file from storage
            Path filePath = this.fileStorageLocation.resolve(getFileNameFromUrl(document.getFileUrl())).normalize();

            if (Files.exists(filePath)) {
                // Analyze the image for fraud
                FraudAnalysisDTO analysis = fraudService.analyzeImage(filePath.toFile());

                // Save fraud result linked to the claim
                fraudService.saveFraudResult(document.getClaim(), analysis);
            }
        } catch (Exception e) {
            System.err.println("Error analyzing document for fraud: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getFileNameFromUrl(String fileUrl) {
        // Extract filename from URL like "/api/documents/filename.jpg"
        return fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
    }

    public List<ClaimDocument> getDocumentsByClaim(Long claimId) {
        return documentRepository.findByClaimId(claimId);
    }
}
