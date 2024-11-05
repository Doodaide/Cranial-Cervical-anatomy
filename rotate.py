import os
from PIL import Image

# Define the folder path for images
folder_path = "legacy_lab_doodles"

# Check if folder exists
if not os.path.exists(folder_path):
    print(f"The folder '{folder_path}' does not exist.")
else:
    # Iterate through each file in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith(".png"):
            image_path = os.path.join(folder_path, filename)

            # Open the image
            with Image.open(image_path) as img:
                # Display image information and get user input for rotation direction
                print(f"Processing: {filename}")
                direction = input("Rotate image (right or left)? Type 'skip' to leave unchanged: ").strip().lower()
                
                # Rotate based on user input
                if direction == "right":
                    rotated_img = img.rotate(-90, expand=True)
                    rotated_img.save(image_path)
                    print(f"Rotated {filename} right and saved.")
                elif direction == "left":
                    rotated_img = img.rotate(90, expand=True)
                    rotated_img.save(image_path)
                    print(f"Rotated {filename} left and saved.")
                elif direction == "skip":
                    print(f"Skipped {filename}.")
                else:
                    print("Invalid input. Skipping image.")
            
            print("")  # Add a blank line for readability between images
    print("Processing complete.")


# // 53 needs rotation, 45, 20 