from pdf2image import convert_from_path

def pdf_to_image(pdf_path, output_format="jpg"):
    """
    Converts a PDF file to images.

    Args:
        pdf_path (str): Path to the PDF file.
        output_format (str): 'jpg' or 'png' (default: 'jpg').

    Returns:
        None
    """
    # Convert PDF to images (list of PIL Image objects)
    images = convert_from_path(pdf_path)

    # Save each page as an image
    for i, image in enumerate(images):
        output_file = f"page_{i + 1}.{output_format}"
        image.save(output_file, output_format.upper())
        print(f"Saved: {output_file}")

# Example usage
pdf_to_image("grid.pdf", "png")
