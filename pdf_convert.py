import os
from pdf2image import convert_from_path
from PIL import Image

# Define paths
pdf_path = 'legacy_lab.pdf'  # Replace with your PDF file path
output_folder = 'legacy_lab_doodles'

# Create output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# Convert PDF to images
pages = convert_from_path(pdf_path)

# Process each page
for i, page in enumerate(pages):
    # Save the original page as a PNG
    original_png_path = os.path.join(output_folder, f'page_{i+1}.png')
    page.save(original_png_path, 'PNG')
    
    # Determine if we should split vertically or horizontally
    width, height = page.size
    if width > height:
        # Split vertically for wider pages
        left_half = page.crop((0, 0, width // 2, height))
        right_half = page.crop((width // 2, 0, width, height))
    else:
        # Split horizontally for taller pages
        top_half = page.crop((0, 0, width, height // 2))
        bottom_half = page.crop((0, height // 2, width, height))
        
    # Save each half
    if width > height:
        left_half.save(os.path.join(output_folder, f'page_{i+1}_left.png'), 'PNG')
        right_half.save(os.path.join(output_folder, f'page_{i+1}_right.png'), 'PNG')
    else:
        top_half.save(os.path.join(output_folder, f'page_{i+1}_top.png'), 'PNG')
        bottom_half.save(os.path.join(output_folder, f'page_{i+1}_bottom.png'), 'PNG')

print("PDF has been split and saved to 'legacy_lab_doodles'.")
