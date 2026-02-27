# import cv2
# import numpy as np


# def detect_leaf_defects(image_bgr):
#     """
#     Detect unhealthy regions in leaf using HSV color segmentation.

#     Returns:
#         severity_percent
#     """
#     h, w = image_bgr.shape[:2]
#     scale = 512 / max(h, w)
#     if scale < 1:
#         image_bgr = cv2.resize(image_bgr, (int(w * scale), int(h * scale)))

#     hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)

#     lower_yellow = np.array([15, 60, 60])
#     upper_yellow = np.array([35, 255, 255])

#     lower_brown = np.array([5, 50, 20])
#     upper_brown = np.array([20, 255, 200])

#     lower_dark = np.array([0, 0, 0])
#     upper_dark = np.array([180, 255, 50])

#     mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
#     mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)
#     mask_dark = cv2.inRange(hsv, lower_dark, upper_dark)

#     disease_mask = cv2.bitwise_or(mask_yellow, mask_brown)
#     disease_mask = cv2.bitwise_or(disease_mask, mask_dark)

#     kernel = np.ones((5, 5), np.uint8)
#     disease_mask = cv2.morphologyEx(disease_mask, cv2.MORPH_OPEN, kernel)
#     disease_mask = cv2.morphologyEx(disease_mask, cv2.MORPH_DILATE, kernel)

#     contours, _ = cv2.findContours(
#         disease_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
#     )

#     infected_area = 0.0

#     for cnt in contours:
#         area = cv2.contourArea(cnt)
#         if area < 500:
#             continue
#         infected_area += area

#     total_area = image_bgr.shape[0] * image_bgr.shape[1]
#     severity = (infected_area / total_area) * 100 if total_area > 0 else 0.0

#     return severity
