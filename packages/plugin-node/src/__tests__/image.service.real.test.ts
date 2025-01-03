import { describe, expect, test, beforeAll, afterAll, vi } from 'vitest';
import { ImageDescriptionService } from '../services/image';
import path from 'path';
import fs from 'fs';
import { elizaLogger } from '@elizaos/core';

describe('ImageDescriptionService Real Tests', () => {
    let service: ImageDescriptionService;
    const testImagesDir = path.join(__dirname, 'fixtures', 'images');
    const mockRuntime = {
        getSetting: (key: string) => {
            if (key === 'OPENAI_API_KEY') return 'add here your key';
            return '';
        },
        character: {
            modelProvider: 'openai'
        },
        imageModelProvider: 'openai'
    };

    beforeAll(async () => {
        // Mock elizaLogger.error
        vi.spyOn(elizaLogger, 'error');
        vi.spyOn(elizaLogger, 'debug');

        // Ensure test images directory exists
        if (!fs.existsSync(testImagesDir)) {
            fs.mkdirSync(testImagesDir, { recursive: true });
        }

        // Verify test images exist
        const requiredImages = ['test.png', 'test.jpg', 'test.gif', 'test.bmp'];
        const missingImages = requiredImages.filter(img => !fs.existsSync(path.join(testImagesDir, img)));
        if (missingImages.length > 0) {
            throw new Error(`Missing test images: ${missingImages.join(', ')}`);
        }

        service = new ImageDescriptionService();
        await service.initialize(mockRuntime as any);
    });

    afterAll(async () => {
        // Cleanup any temporary files created during tests
        const tempFiles = fs.readdirSync(testImagesDir).filter(f => f.startsWith('gif_frame_') || f === 'corrupted.jpg');
        tempFiles.forEach(file => {
            const filePath = path.join(testImagesDir, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        vi.restoreAllMocks();
    });

    describe('Real Image Processing', () => {
        const verifyImageExists = (imagePath: string) => {
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Test image not found: ${imagePath}`);
            }
        };

        const validateImageDescription = (result: { title: string; description: string }) => {
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('description');
            expect(result.title.length).toBeGreaterThan(0);
            expect(result.description.length).toBeGreaterThan(0);
            expect(typeof result.title).toBe('string');
            expect(typeof result.description).toBe('string');
        };

        test('should process a real PNG image with colors', async () => {
            const imagePath = path.join(testImagesDir, 'test.png');
            verifyImageExists(imagePath);
            
            const result = await service.describeImage(imagePath);
            validateImageDescription(result);
            
            // Should mention dice since that's what's in our test image
            expect(result.description.toLowerCase()).toMatch(/dice|die/);
        }, 30000);

        test('should process a real JPEG image with proper compression', async () => {
            const imagePath = path.join(testImagesDir, 'test.jpg');
            verifyImageExists(imagePath);
            
            const result = await service.describeImage(imagePath);
            validateImageDescription(result);
        }, 30000);

        test('should process a real GIF image and extract first frame', async () => {
            const imagePath = path.join(testImagesDir, 'test.gif');
            verifyImageExists(imagePath);
            
            const result = await service.describeImage(imagePath);
            validateImageDescription(result);

            // Verify temp file cleanup
            const tempFiles = fs.readdirSync(testImagesDir).filter(f => f.startsWith('gif_frame_'));
            expect(tempFiles.length).toBe(0);
        }, 30000);

        test('should reject an unsupported BMP image with clear error', async () => {
            const imagePath = path.join(testImagesDir, 'test.bmp');
            verifyImageExists(imagePath);
            
            await expect(service.describeImage(imagePath))
                .rejects
                .toThrow('Unsupported image format');

            // Verify error was logged
            expect(elizaLogger.error).toHaveBeenCalledWith(
                'Image format validation failed:',
                expect.objectContaining({
                    url: imagePath,
                    error: expect.stringContaining('Unsupported image format')
                })
            );
        });

        test('should handle real network image URLs with proper timeout', async () => {
            const imageUrl = 'https://raw.githubusercontent.com/microsoft/vscode/main/resources/linux/code.png';
            
            const result = await service.describeImage(imageUrl);
            validateImageDescription(result);
        }, 45000); // Increased timeout for network request

        test('should handle network timeouts gracefully', async () => {
            const imageUrl = 'https://example.com/nonexistent.jpg';
            
            await expect(service.describeImage(imageUrl))
                .rejects
                .toThrow(/Failed to fetch image|Network error/);
        }, 30000);

        test('should handle malformed image data', async () => {
            // Create a corrupted image file
            const corruptedImagePath = path.join(testImagesDir, 'corrupted.jpg');
            fs.writeFileSync(corruptedImagePath, Buffer.from('not an image'));
            
            try {
                await expect(service.describeImage(corruptedImagePath))
                    .rejects
                    .toThrow(/You uploaded an unsupported image|Invalid image format/);
            } finally {
                // Cleanup
                if (fs.existsSync(corruptedImagePath)) {
                    fs.unlinkSync(corruptedImagePath);
                }
            }
        });
    });
}); 