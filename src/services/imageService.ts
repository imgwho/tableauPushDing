import sharp from "sharp";

export class ImageService {
    async stitchImagesVertically(imageBuffers: Buffer[]): Promise<Buffer> {
        if (imageBuffers.length === 0) {
            throw new Error("No images to stitch.");
        }
        if (imageBuffers.length === 1) {
            return imageBuffers[0];
        }

        try {
            // 1. Get metadata for all images
            const metadatas = await Promise.all(imageBuffers.map(buf => sharp(buf).metadata()));

            // 2. Calculate dimensions
            const maxWidth = Math.max(...metadatas.map(m => m.width || 0));
            const totalHeight = metadatas.reduce((sum, m) => sum + (m.height || 0), 0);

            // 3. Create composition instructions
            let currentY = 0;
            const composites = imageBuffers.map((buf, index) => {
                const meta = metadatas[index];
                const input = { input: buf, top: currentY, left: 0 };
                // If we wanted to center smaller images:
                // const left = Math.floor((maxWidth - (meta.width || 0)) / 2);
                // input.left = left;
                
                currentY += (meta.height || 0);
                return input;
            });

            // 4. Create new image
            const result = await sharp({
                create: {
                    width: maxWidth,
                    height: totalHeight,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            })
            .composite(composites)
            .png()
            .toBuffer();

            return result;
        } catch (error) {
            console.error("Failed to stitch images:", error);
            throw error;
        }
    }
}

export const imageService = new ImageService();
