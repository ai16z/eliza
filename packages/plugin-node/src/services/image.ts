import { elizaLogger, models } from "@elizaos/core";
import { Service } from "@elizaos/core";
import {
    IAgentRuntime,
    ModelProviderName,
    ServiceType,
    IImageDescriptionService,
} from "@elizaos/core";
import {
    AutoProcessor,
    AutoTokenizer,
    env,
    Florence2ForConditionalGeneration,
    Florence2Processor,
    PreTrainedModel,
    PreTrainedTokenizer,
    RawImage,
    type Tensor,
} from "@huggingface/transformers";
import fs from "fs";
import gifFrames from "gif-frames";
import os from "os";
import path from "path";

export class ImageDescriptionService
    extends Service
    implements IImageDescriptionService
{
    static serviceType: ServiceType = ServiceType.IMAGE_DESCRIPTION;

    private static readonly SUPPORTED_FORMATS = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };

    private modelId: string = "onnx-community/Florence-2-base-ft";
    private device: string = "gpu";
    private model: PreTrainedModel | null = null;
    private processor: Florence2Processor | null = null;
    private tokenizer: PreTrainedTokenizer | null = null;
    private initialized: boolean = false;
    private runtime: IAgentRuntime | null = null;
    private queue: string[] = [];
    private processing: boolean = false;

    getInstance(): IImageDescriptionService {
        return ImageDescriptionService.getInstance();
    }

    async initialize(runtime: IAgentRuntime): Promise<void> {
        elizaLogger.log("Initializing ImageDescriptionService");
        this.runtime = runtime;
    }

    private async initializeLocalModel(): Promise<void> {
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        env.backends.onnx.logLevel = "fatal";
        env.backends.onnx.wasm.proxy = false;
        env.backends.onnx.wasm.numThreads = 1;

        elizaLogger.info("Downloading Florence model...");

        this.model = await Florence2ForConditionalGeneration.from_pretrained(
            this.modelId,
            {
                device: "gpu",
                progress_callback: (progress) => {
                    if (progress.status === "downloading") {
                        const percent = (
                            (progress.loaded / progress.total) *
                            100
                        ).toFixed(1);
                        const dots = ".".repeat(
                            Math.floor(Number(percent) / 5)
                        );
                        elizaLogger.info(
                            `Downloading Florence model: [${dots.padEnd(20, " ")}] ${percent}%`
                        );
                    }
                },
            }
        );

        elizaLogger.success("Florence model downloaded successfully");

        elizaLogger.info("Downloading processor...");
        this.processor = (await AutoProcessor.from_pretrained(
            this.modelId
        )) as Florence2Processor;

        elizaLogger.info("Downloading tokenizer...");
        this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId);
        elizaLogger.success("Image service initialization complete");
    }

    async describeImage(
        imageUrl: string
    ): Promise<{ title: string; description: string }> {
        if (!this.initialized) {
            const model = models[this.runtime?.character?.modelProvider];

            if (model === models[ModelProviderName.LLAMALOCAL]) {
                await this.initializeLocalModel();
            } else {
                this.modelId = "gpt-4o-mini";
                this.device = "cloud";
            }

            this.initialized = true;
        }

        if (this.device === "cloud") {
            if (!this.runtime) {
                throw new Error(
                    "Runtime is required for OpenAI image recognition"
                );
            }
            return this.recognizeWithOpenAI(imageUrl);
        }

        this.queue.push(imageUrl);
        this.processQueue();

        return new Promise((resolve, _reject) => {
            const checkQueue = () => {
                const index = this.queue.indexOf(imageUrl);
                if (index !== -1) {
                    setTimeout(checkQueue, 100);
                } else {
                    resolve(this.processImage(imageUrl));
                }
            };
            checkQueue();
        });
    }

    private async recognizeWithOpenAI(
        imageUrl: string
    ): Promise<{ title: string; description: string }> {
        elizaLogger.debug(`Attempting to recognize image: ${imageUrl}`);
        
        const { isValid, mimeType } = this.validateImageFormat(imageUrl);
        if (!isValid) {
            const supportedFormats = Object.keys(ImageDescriptionService.SUPPORTED_FORMATS)
                .map(ext => ext.slice(1))
                .join(', ');
            const errorMessage = `Unsupported image format for ${imageUrl}. Please use one of the following formats: ${supportedFormats}`;
            elizaLogger.error('Image format validation failed:', {
                url: imageUrl,
                supportedFormats,
                error: errorMessage
            });
            throw new Error(errorMessage);
        }
        elizaLogger.debug(`Image format validated successfully: ${mimeType}`);

        const isGif = imageUrl.toLowerCase().endsWith(".gif");
        let imageData: Buffer | null = null;

        try {
            if (isGif) {
                elizaLogger.debug('Processing GIF image, extracting first frame');
                const { filePath } = await this.extractFirstFrameFromGif(imageUrl);
                imageData = fs.readFileSync(filePath);
                elizaLogger.debug('Successfully extracted first frame from GIF');
            } else if (fs.existsSync(imageUrl)) {
                elizaLogger.debug('Reading local image file');
                imageData = fs.readFileSync(imageUrl);
            } else {
                elizaLogger.debug('Fetching remote image');
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    const errorMessage = `Failed to fetch image: ${response.statusText} (${response.status})`;
                    elizaLogger.error('Image fetch failed:', {
                        url: imageUrl,
                        status: response.status,
                        statusText: response.statusText
                    });
                    throw new Error(errorMessage);
                }
                imageData = Buffer.from(await response.arrayBuffer());
                elizaLogger.debug('Successfully fetched remote image');
            }

            if (!imageData || imageData.length === 0) {
                const errorMessage = "Failed to fetch image data: Empty response";
                elizaLogger.error('Image data validation failed:', {
                    url: imageUrl,
                    error: errorMessage
                });
                throw new Error(errorMessage);
            }

            const prompt = "Describe this image and give it a title. The first line should be the title, and then a line break, then a detailed description of the image. Respond with the format 'title\\ndescription'";
            elizaLogger.debug('Sending image to OpenAI for recognition');
            const text = await this.requestOpenAI(
                imageUrl,
                imageData,
                prompt,
                isGif,
                true
            );

            const [title, ...descriptionParts] = text.split("\n");
            elizaLogger.debug('Successfully generated image description', {
                titleLength: title.length,
                descriptionLength: descriptionParts.join("\n").length
            });
            
            return {
                title,
                description: descriptionParts.join("\n"),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            elizaLogger.error('Error in recognizeWithOpenAI:', {
                url: imageUrl,
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    private async requestOpenAI(
        imageUrl: string,
        imageData: Buffer,
        prompt: string,
        isGif: boolean = false,
        isLocalFile: boolean = false
    ): Promise<string> {
        for (let attempt = 0; attempt < 3; attempt++) {
            elizaLogger.debug(`OpenAI API request attempt ${attempt + 1}/3`);
            try {
                const shouldUseBase64 = isGif || isLocalFile;
                const { mimeType } = this.validateImageFormat(imageUrl);
                if (!mimeType) {
                    const errorMessage = "Invalid image format detected during OpenAI request";
                    elizaLogger.error('MIME type validation failed:', {
                        url: imageUrl,
                        error: errorMessage
                    });
                    throw new Error(errorMessage);
                }

                const base64Data = imageData.toString("base64");
                const imageUrlToUse = shouldUseBase64
                    ? `data:${mimeType};base64,${base64Data}`
                    : imageUrl;

                elizaLogger.debug('Preparing OpenAI API request', {
                    isBase64: shouldUseBase64,
                    mimeType
                });

                const content = [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrlToUse,
                        },
                    },
                ];

                const endpoint = models[this.runtime.imageModelProvider].endpoint ?? "https://api.openai.com/v1";
                elizaLogger.debug(`Using OpenAI endpoint: ${endpoint}`);

                const response = await fetch(endpoint + "/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.runtime.getSetting("OPENAI_API_KEY")}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [{ role: "user", content }],
                        max_tokens: shouldUseBase64 ? 500 : 300,
                    }),
                });

                if (!response.ok) {
                    const responseText = await response.text();
                    elizaLogger.error('OpenAI API error:', {
                        status: response.status,
                        response: responseText,
                        attempt: attempt + 1
                    });
                    throw new Error(`OpenAI API error (${response.status}): ${responseText}`);
                }

                const data = await response.json();
                elizaLogger.debug('Successfully received OpenAI API response', {
                    status: response.status,
                    hasChoices: !!data.choices,
                    choicesLength: data.choices?.length,
                    firstChoice: data.choices?.[0],
                    rawResponse: data
                });
                const responseContent = data.choices[0].message.content;
                elizaLogger.debug('Extracted content from response', {
                    content: responseContent,
                    contentLength: responseContent.length
                });
                return responseContent;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                elizaLogger.error('OpenAI request failed:', {
                    attempt: attempt + 1,
                    error: errorMessage,
                    stack: error instanceof Error ? error.stack : undefined
                });
                if (attempt === 2) throw error;
            }
        }
        const finalError = "Failed to recognize image with OpenAI after 3 attempts";
        elizaLogger.error('All OpenAI API attempts failed', {
            url: imageUrl,
            error: finalError
        });
        throw new Error(finalError);
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        while (this.queue.length > 0) {
            const imageUrl = this.queue.shift();
            await this.processImage(imageUrl);
        }
        this.processing = false;
    }

    private async processImage(
        imageUrl: string
    ): Promise<{ title: string; description: string }> {
        if (!this.model || !this.processor || !this.tokenizer) {
            throw new Error("Model components not initialized");
        }

        elizaLogger.log("Processing image:", imageUrl);
        const isGif = imageUrl.toLowerCase().endsWith(".gif");
        let imageToProcess = imageUrl;

        try {
            if (isGif) {
                elizaLogger.log("Extracting first frame from GIF");
                const { filePath } =
                    await this.extractFirstFrameFromGif(imageUrl);
                imageToProcess = filePath;
            }

            const image = await RawImage.fromURL(imageToProcess);
            const visionInputs = await this.processor(image);
            const prompts =
                this.processor.construct_prompts("<DETAILED_CAPTION>");
            const textInputs = this.tokenizer(prompts);

            elizaLogger.log("Generating image description");
            const generatedIds = (await this.model.generate({
                ...textInputs,
                ...visionInputs,
                max_new_tokens: 256,
            })) as Tensor;

            const generatedText = this.tokenizer.batch_decode(generatedIds, {
                skip_special_tokens: false,
            })[0];

            const result = this.processor.post_process_generation(
                generatedText,
                "<DETAILED_CAPTION>",
                image.size
            );

            const detailedCaption = result["<DETAILED_CAPTION>"] as string;
            return { title: detailedCaption, description: detailedCaption };
        } catch (error) {
            elizaLogger.error("Error processing image:", error);
            throw error;
        } finally {
            if (isGif && imageToProcess !== imageUrl) {
                fs.unlinkSync(imageToProcess);
            }
        }
    }

    private async extractFirstFrameFromGif(
        gifUrl: string
    ): Promise<{ filePath: string }> {
        const frameData = await gifFrames({
            url: gifUrl,
            frames: 1,
            outputType: "png",
        });

        const tempFilePath = path.join(
            os.tmpdir(),
            `gif_frame_${Date.now()}.png`
        );

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(tempFilePath);
            frameData[0].getImage().pipe(writeStream);
            writeStream.on("finish", () => resolve({ filePath: tempFilePath }));
            writeStream.on("error", reject);
        });
    }

    private validateImageFormat(imageUrl: string): { isValid: boolean; mimeType: string | null } {
        const extension = path.extname(imageUrl).toLowerCase();
        const mimeType = ImageDescriptionService.SUPPORTED_FORMATS[extension];
        return {
            isValid: !!mimeType,
            mimeType: mimeType || null
        };
    }
}

export default ImageDescriptionService;
