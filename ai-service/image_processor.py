import cv2
import numpy as np
from PIL import Image
from pathlib import Path


class ImageProcessor:
    """
    Image preprocessing and validation for fraud detection
    """
    
    def __init__(self):
        self.min_resolution = (100, 100)  # Minimum acceptable resolution
        self.max_file_size = 10 * 1024 * 1024  # 10MB
    
    def process_image(self, image_path):
        """
        Process and validate an image
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with processing results and validation status
        """
        try:
            img_path = Path(image_path)
            
            # Check file size
            file_size = img_path.stat().st_size
            if file_size > self.max_file_size:
                return {
                    "valid": False,
                    "error": "File size exceeds 10MB limit"
                }
            
            # Load image with PIL for basic checks
            pil_image = Image.open(image_path)
            width, height = pil_image.size
            
            # Check resolution
            if width < self.min_resolution[0] or height < self.min_resolution[1]:
                return {
                    "valid": False,
                    "error": f"Image resolution too low. Minimum: {self.min_resolution}"
                }
            
            # Load with OpenCV for analysis
            cv_image = cv2.imread(str(image_path))
            if cv_image is None:
                return {
                    "valid": False,
                    "error": "Could not read image with OpenCV"
                }
            
            # Calculate image quality metrics
            quality_score = self._assess_quality(cv_image)
            blur_score = self._detect_blur(cv_image)
            
            return {
                "valid": True,
                "width": width,
                "height": height,
                "file_size": file_size,
                "format": pil_image.format,
                "mode": pil_image.mode,
                "quality": quality_score,
                "blur_level": blur_score,
                "channels": cv_image.shape[2] if len(cv_image.shape) > 2 else 1
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Image processing error: {str(e)}"
            }
    
    def _assess_quality(self, image):
        """
        Assess overall image quality
        Returns score from 0-100
        """
        try:
            # Calculate image sharpness using Laplacian variance
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) > 2 else image
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Normalize to 0-100 scale (higher is better)
            quality = min(100, laplacian_var / 10)
            
            return round(quality, 2)
        except:
            return 50  # Default medium quality
    
    def _detect_blur(self, image):
        """
        Detect blur in image
        Returns blur score (0 = sharp, 100 = very blurry)
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) > 2 else image
            
            # Use Laplacian variance - lower values indicate more blur
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Convert to blur score (inverse)
            # Typical sharp images have variance > 100
            if laplacian_var > 100:
                blur_score = 0
            elif laplacian_var > 50:
                blur_score = 30
            elif laplacian_var > 20:
                blur_score = 60
            else:
                blur_score = 90
            
            return blur_score
        except:
            return 50  # Default medium blur
    
    def resize_for_analysis(self, image, max_dimension=1024):
        """
        Resize image if it's too large for efficient processing
        """
        height, width = image.shape[:2]
        
        if max(height, width) <= max_dimension:
            return image
        
        # Calculate new dimensions
        if width > height:
            new_width = max_dimension
            new_height = int(height * (max_dimension / width))
        else:
            new_height = max_dimension
            new_width = int(width * (max_dimension / height))
        
        return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)

    def prepare_for_model(self, image_path, target_size=(224, 224)):
        """
        Load and prepare an image for CNN + ViT inference.

        Returns:
            PIL.Image in RGB mode, resized to target_size (224x224 by default).
            Returns None if the image cannot be opened.
        """
        try:
            from PIL import Image as PILImage
            img = PILImage.open(image_path).convert("RGB")
            img = img.resize(target_size, PILImage.BILINEAR)
            return img
        except Exception as e:
            print(f"[ImageProcessor] prepare_for_model failed: {e}")
            return None

