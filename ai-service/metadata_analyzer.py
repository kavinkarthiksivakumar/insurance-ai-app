from PIL import Image
from PIL.ExifTags import TAGS
import magic
from datetime import datetime


class MetadataAnalyzer:
    """
    Analyze image metadata for fraud indicators
    """
    
    def __init__(self):
        # Known photo editing software signatures
        self.editing_software = [
            'Adobe Photoshop',
            'GIMP',
            'Paint.NET',
            'Affinity Photo',
            'Corel',
            'PhotoDirector',
            'Lightroom',
            'Snapseed'
        ]
    
    def analyze_metadata(self, image_path):
        """
        Extract and analyze image metadata for tampering indicators
        
        Returns:
            Dictionary with metadata analysis results
        """
        try:
            image = Image.open(image_path)
            exif_data = self._extract_exif(image)
            
            # Get file type information
            try:
                file_type = magic.from_file(image_path, mime=True)
            except:
                file_type = "unknown"
            
            flags = []
            tampering_score = 0
            
            # Check for editing software
            software = exif_data.get('Software', '')
            if any(editor in software for editor in self.editing_software):
                flags.append(f"Edited with {software}")
                tampering_score += 30
            
            # Check for missing EXIF data (sometimes indicates manipulation)
            if not exif_data or len(exif_data) < 5:
                flags.append("Limited or missing EXIF data")
                tampering_score += 20
            
            # Check for date/time inconsistencies
            date_created = exif_data.get('DateTime', None)
            date_original = exif_data.get('DateTimeOriginal', None)
            
            if date_created and date_original and date_created != date_original:
                flags.append("Date/time inconsistency detected")
                tampering_score += 15
            
            # Check camera/device info
            camera_make = exif_data.get('Make', '')
            camera_model = exif_data.get('Model', '')
            
            if not camera_make and not camera_model:
                flags.append("No camera information found")
                tampering_score += 10
            
            return {
                "valid": True,
                "exif_data": exif_data,
                "file_type": file_type,
                "flags": flags,
                "tampering_score": min(tampering_score, 100),
                "camera_make": camera_make,
                "camera_model": camera_model,
                "software": software,
                "datetime": date_created or date_original
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Metadata analysis error: {str(e)}",
                "flags": ["Failed to read metadata"],
                "tampering_score": 40
            }
    
    def _extract_exif(self, image):
        """
        Extract EXIF data from image
        """
        exif_data = {}
        
        try:
            exif = image._getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    exif_data[tag] = str(value)
        except:
            pass
        
        return exif_data
    
    def check_for_deepfake_indicators(self, exif_data):
        """
        Check for common deepfake/AI-generated image indicators
        
        Note: This is a simplified heuristic. Real deepfake detection
        requires machine learning models.
        """
        indicators = []
        score = 0
        
        # AI-generated images often lack camera EXIF data
        if not exif_data.get('Make') and not exif_data.get('Model'):
            indicators.append("No camera metadata")
            score += 25
        
        # Check for common AI generation software
        software = exif_data.get('Software', '').lower()
        ai_keywords = ['midjourney', 'stable diffusion', 'dall-e', 'generated']
        
        if any(keyword in software for keyword in ai_keywords):
            indicators.append("AI generation software detected")
            score += 50
        
        return {
            "indicators": indicators,
            "ai_generation_score": score
        }
