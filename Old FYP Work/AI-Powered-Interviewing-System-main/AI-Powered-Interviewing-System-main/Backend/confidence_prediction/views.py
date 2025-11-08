# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import cv2
import numpy as np
from mtcnn import MTCNN
from deepface import DeepFace
import os
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from mtcnn import MTCNN
from deepface import DeepFace
import cv2
import os
import logging
from django.conf import settings
import numpy as np

logger = logging.getLogger(__name__)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from mtcnn import MTCNN
from deepface import DeepFace
import cv2
import os
import logging
import numpy as np
from django.conf import settings

logger = logging.getLogger(__name__)

class FaceVerificationView(APIView):
    permission_classes = [IsAuthenticated]
    TARGET_SIZE = (640, 480)  # Standard size for processing

    def __init__(self):
        super().__init__()
        self.detector = MTCNN()

    def get_image_path(self, image_url):
        """Convert database image URL to absolute file path."""
        if not image_url or image_url == 'null':
            raise ValueError("No profile image URL provided")
        
        try:
            if '/media/' in image_url:
                media_index = image_url.find('/media/')
                if media_index >= 0:
                    path_after_media = image_url[media_index + 7:]
                    absolute_path = os.path.join(settings.MEDIA_ROOT, path_after_media)
                    
                    if not os.path.exists(absolute_path):
                        raise ValueError(f"Profile image not found at: {absolute_path}")
                    
                    return absolute_path
                    
            raise ValueError(f"Invalid image URL format: {image_url}")
            
        except Exception as e:
            logger.error("Error processing image path: %s", str(e))
            raise ValueError(f"Error processing image path: {str(e)}")

    def preprocess_image(self, image_path):
        """Preprocess image for consistent size and format."""
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not read image")
            
            # Convert BGR to RGB
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Resize to target size while maintaining aspect ratio
            h, w = img_rgb.shape[:2]
            target_w, target_h = self.TARGET_SIZE
            
            # Calculate scaling factor
            scale = min(target_w/w, target_h/h)
            new_w, new_h = int(w*scale), int(h*scale)
            
            # Resize image
            resized = cv2.resize(img_rgb, (new_w, new_h))
            
            # Create black canvas of target size
            canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
            
            # Calculate position to paste resized image
            y_offset = (target_h - new_h) // 2
            x_offset = (target_w - new_w) // 2
            
            # Paste resized image onto canvas
            canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
            
            return canvas
            
        except Exception as e:
            logger.error(f"Image preprocessing error: {str(e)}")
            raise ValueError(f"Image preprocessing failed: {str(e)}")

    def validate_frame(self, frame):
        """Checks if the frame contains exactly one face."""
        try:
            # Detect faces
            faces = self.detector.detect_faces(frame)
            
            if len(faces) == 0:
                return {"error": "No face detected. Please ensure your face is clearly visible."}
            elif len(faces) > 1:
                return {"error": "Multiple faces detected. Please ensure only your face is in the frame."}
            
            face = faces[0]
            if face['confidence'] < 0.85:
                return {"error": "Face not clear enough. Please ensure good lighting and look directly at the camera."}

            return {"valid": True}
        except Exception as e:
            logger.error(f"Face validation error: {str(e)}")
            return {"error": f"Face validation failed: {str(e)}"}

    def verify_faces(self, ref_img_path, target_img_path):
        """Verifies whether the faces in two images belong to the same person."""
        try:
            # Preprocess both images
            ref_img = self.preprocess_image(ref_img_path)
            target_img = self.preprocess_image(target_img_path)
            
            # Save preprocessed images temporarily
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            
            temp_ref_path = os.path.join(temp_dir, 'temp_ref.jpg')
            temp_target_path = os.path.join(temp_dir, 'temp_target.jpg')
            
            # Save images with high quality
            cv2.imwrite(temp_ref_path, cv2.cvtColor(ref_img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 95])
            cv2.imwrite(temp_target_path, cv2.cvtColor(target_img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            try:
                # Perform verification with preprocessed images
                result = DeepFace.verify(
                    img1_path=temp_ref_path,
                    img2_path=temp_target_path,
                    model_name="Facenet",
                    detector_backend='mtcnn',
                    enforce_detection=False,  # Set to False to handle edge cases
                    align=True
                )
                
                return {
                    "match": result["verified"],
                    "confidence": round((1 - result.get("distance", 0)) * 100, 2)
                }
            
            finally:
                # Clean up temporary files
                for path in [temp_ref_path, temp_target_path]:
                    try:
                        if os.path.exists(path):
                            os.remove(path)
                    except Exception:
                        pass
            
        except Exception as e:
            logger.error(f"Verification error: {str(e)}")
            return {"error": f"Verification failed: {str(e)}"}

    def post(self, request):
        try:
            # Get and validate reference image
            ref_image = request.FILES.get('ref_image')
            if not ref_image:
                return Response(
                    {"error": "No reference image provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get and validate target image path
            target_image = request.data.get('target_image')
            if not target_image or target_image == 'null':
                return Response(
                    {"error": "No profile image found. Please upload your profile image first."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                target_image_path = self.get_image_path(target_image)
            except ValueError as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create temp directory if it doesn't exist
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
            os.makedirs(temp_dir, exist_ok=True)

            # Save reference image
            ref_image_path = os.path.join(temp_dir, f'ref_{request.user.id}_{ref_image.name}')
            with open(ref_image_path, 'wb+') as destination:
                for chunk in ref_image.chunks():
                    destination.write(chunk)

            try:
                # Preprocess and validate reference image
                ref_img = self.preprocess_image(ref_image_path)
                validation_result = self.validate_frame(ref_img)
                if "error" in validation_result:
                    return Response(validation_result, status=status.HTTP_400_BAD_REQUEST)

                # Verify faces
                verification_result = self.verify_faces(ref_image_path, target_image_path)
                if "error" in verification_result:
                    return Response(verification_result, status=status.HTTP_400_BAD_REQUEST)

                return Response(verification_result)

            finally:
                # Clean up reference image
                try:
                    if os.path.exists(ref_image_path):
                        os.remove(ref_image_path)
                except Exception:
                    pass

        except Exception as e:
            logger.error(f"Verification process failed: {str(e)}")
            return Response(
                {"error": f"Verification process failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated,AllowAny
from mtcnn import MTCNN
from deepface import DeepFace
import cv2
import os
import logging
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
logger = logging.getLogger(__name__)
@method_decorator(csrf_exempt, name='dispatch')
class FaceVerificationCheat(APIView):
    permission_classes = [AllowAny]

    def __init__(self):
        super().__init__()
        self.detector = MTCNN()

    def get_image_path(self, image_url):
        """Convert database image URL to absolute file path."""
        if not image_url or image_url == 'null':
            return False
        
        try:
            if '/media/' in image_url:
                media_index = image_url.find('/media/')
                if media_index >= 0:
                    path_after_media = image_url[media_index + 7:]
                    absolute_path = os.path.join(settings.MEDIA_ROOT, path_after_media)
                    return absolute_path if os.path.exists(absolute_path) else False
            return False
        except Exception:
            return False

    def verify_single_frame(self, frame_path, target_image_path):
        """Verify a single frame against the target image, returning only True/False."""
        try:
            # Verify faces
            result = DeepFace.verify(
                img1_path=frame_path,
                img2_path=target_image_path,
                model_name="Facenet",
                detector_backend='mtcnn',
                enforce_detection=False,  # Changed to False to avoid errors on unclear frames
                align=True
            )
            return result.get("verified", False)
        except Exception:
            return False

    def post(self, request):
        """
        Handle verification of multiple frames against a profile image.
        Expected input:
        {
            "profile_image": "/media/profile_image.jpg",
            "frames": [
                {"url": "/media/frame1.jpg"},
                {"url": "/media/frame2.jpg"},
                ...
            ]
        }
        """
        try:
            # Get profile image path
            profile_image = request.data.get('profile_image')
            if not profile_image:
                return Response({"error": "No profile image provided"}, status=status.HTTP_400_BAD_REQUEST)

            profile_image_path = self.get_image_path(profile_image)
            if not profile_image_path:
                return Response({"error": "Invalid profile image path"}, status=status.HTTP_400_BAD_REQUEST)

            # Get frames
            frames = request.data.get('frames', [])
            if not frames:
                return Response({"error": "No frames provided"}, status=status.HTTP_400_BAD_REQUEST)

            # Process each frame
            verification_results = []
            for frame in frames:
                frame_url = frame.get('url')
                frame_path = self.get_image_path(frame_url)
                
                if frame_path:
                    is_verified = self.verify_single_frame(frame_path, profile_image_path)
                else:
                    is_verified = False
                
                verification_results.append({
                    "frame_url": frame_url,
                    "verified": is_verified
                })
                logger.info(f" Face Verification Results: {verification_results}")

                print("verification_results",verification_results)

            print("verification_results",verification_results)

            return Response({
                "verification_results": verification_results,
                "summary": {
                    "total_frames": len(frames),
                    "verified_frames": sum(1 for result in verification_results if result["verified"]),
                    "verification_rate": round(sum(1 for result in verification_results if result["verified"]) / len(frames) * 100, 2)
                }
            })

        except Exception as e:
            logger.error(f"Verification process failed: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)








# confidence_prediction/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
import numpy as np
import tensorflow as tf
from mtcnn import MTCNN
import cv2
import requests
from io import BytesIO
import threading

class ConfidencePredictor:
    def __init__(self):
        self.model = tf.keras.models.load_model(r"D:\confidence prediction\confidence_measuring_ver4.keras")
        self.detector = MTCNN()
        self.picture_size = 48

    def process_image_url(self, image_url):
        try:
            # Download image from URL
            response = requests.get(image_url)
            img_array = np.frombuffer(response.content, dtype=np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            
            # Convert to RGB for MTCNN
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Detect face
            faces = self.detector.detect_faces(img_rgb)
            if not faces:
                return None
            
            # Extract and process face
            x, y, width, height = faces[0]['box']
            face = img[max(0,y):y+height, max(0,x):x+width]
            gray_face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
            resized_face = cv2.resize(gray_face, (self.picture_size, self.picture_size))
            
            # Prepare for prediction
            normalized = resized_face / 255.0
            input_array = np.expand_dims(np.expand_dims(normalized, axis=0), axis=-1)
            
            # Get prediction and return only the confidence percentage
            prediction = self.model.predict(input_array)
            confidence_percentage = (1 - prediction[0][0]) * 100
            
            return round(confidence_percentage, 2)  # Round to 2 decimal places
            
        except Exception as e:
            print(f"Error processing image: {e}")
            return None
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
@api_view(['POST'])
@permission_classes([AllowAny])  # Require authentication
def analyze_confidence(request):
    try:
        frames = request.data.get('frames', [])
        if not frames:
            return Response({'error': 'No frames provided'}, status=400)

        predictor = ConfidencePredictor()
        confidence_scores = []
        
        # Process each frame
        for frame in frames:
            frame=frame.get('url')
            score = predictor.process_image_url(frame)
            if score is not None:
                confidence_scores.append(score)
                print("Confidence Scores of frame :",score)
        
        if not confidence_scores:
            return Response({'error': 'No valid predictions'}, status=400)
        
        # Convert to 1-10 scale
        normalized_scores = [round(score / 10, 1) for score in confidence_scores]
        # Calculate average confidence score
        average_confidence = round(np.mean(normalized_scores), 2)
        
        # Calculate final score (20% of the mean)
        final_score = round(average_confidence * 0.2, 2)
        return Response({
            'confidence_scores': normalized_scores,
            'average_confidence': average_confidence,  # This will be like 77.85%
            'final_score': final_score  # This will be the 20% portion on 0-10 scale
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)