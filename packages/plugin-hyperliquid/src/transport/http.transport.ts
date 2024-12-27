import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { elizaLogger } from '@elizaos/core';
import { ethers } from 'ethers';
import { signL1Action } from '../utils/signing';
import { MarginError, PositionError, OrderError } from '../errors';

interface RequestMetadata {
    startTime: number;
}

declare module 'axios' {
    interface InternalAxiosRequestConfig {
        metadata?: RequestMetadata;
    }
}

export interface HttpTransportConfig {
    baseUrl: string;
    timeout?: number;
    privateKey?: string;
    walletAddress: string;
    isMainnet: boolean;
}

export class HttpTransport {
    private readonly infoApi: AxiosInstance;
    private readonly exchangeApi: AxiosInstance;
    private readonly baseUrl: string;
    private readonly privateKey?: string;
    private readonly walletAddress: string;
    private readonly isMainnet: boolean;

    constructor(config: HttpTransportConfig) {
        this.baseUrl = config.baseUrl;
        this.privateKey = config.privateKey;
        this.walletAddress = config.walletAddress;
        this.isMainnet = config.isMainnet;

        this.infoApi = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.exchangeApi = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.setupInterceptors(this.infoApi);
        this.setupInterceptors(this.exchangeApi);
    }

    private setupInterceptors(api: AxiosInstance): void {
        api.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                config.metadata = { startTime: Date.now() };
                return config;
            }
        );

        api.interceptors.response.use(
            (response: AxiosResponse) => {
                const duration = Date.now() - (response.config.metadata?.startTime || 0);
                elizaLogger.debug(`Request to ${response.config.url} completed in ${duration}ms`);
                return response;
            },
            (error: AxiosError) => {
                if (error.response) {
                    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
                    elizaLogger.error(`Request to ${error.config?.url} failed in ${duration}ms:`, error);
                }
                return Promise.reject(error);
            }
        );
    }

    public async infoRequest<T>(params: Record<string, any> = {}): Promise<T> {
        try {
            const response = await this.infoApi.post<T>('/info', params);
            if (response.data === null || response.data === undefined) {
                elizaLogger.debug('API returned empty response, using default value based on request type');
                switch (params.type) {
                    case 'openOrders':
                        return { orders: [] } as T;
                    case 'userFills':
                    case 'userFillsByTime':
                        return { fills: [] } as T;
                    default:
                        return {} as T;
                }
            }
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                elizaLogger.error('Info API request failed:', error.response?.data || error.message);
                throw new Error(`Info API request failed: ${error.response?.data?.message || error.message}`);
            }
            elizaLogger.error('Unexpected error during info request:', error);
            throw new Error(`Unexpected error during info request: ${(error as Error).message}`);
        }
    }

    public async exchangeRequest<T>(action: Record<string, any>, vaultAddress: string | null = null): Promise<T> {
        try {
            if (!this.privateKey) {
                throw new Error('Private key is required for exchange requests');
            }

            const nonce = Date.now();
            const wallet = new ethers.Wallet(this.privateKey);
            const signature = await signL1Action(wallet, action, vaultAddress, nonce, this.isMainnet);

            const request = {
                action,
                nonce,
                signature,
                ...(vaultAddress && { vaultAddress })
            };

            const response = await this.exchangeApi.post<T>('/exchange', request);
            if (response.data === null || response.data === undefined) {
                elizaLogger.debug('API returned empty response');
                return {} as T;
            }

            // Check for errors in the response
            const responseData = response.data as any;
            if (responseData.status === 'err') {
                const error = responseData.response?.data?.statuses?.[0]?.error;
                if (error) {
                    // Handle specific error types
                    if (error.includes('margin')) {
                        throw new MarginError(error);
                    }
                    if (error.includes('position cap') || error.includes('open interest is at cap')) {
                        throw new PositionError(error);
                    }
                    if (error.includes('reduce only') || error.includes('would increase position')) {
                        throw new OrderError(error);
                    }
                    if (error.includes('never placed') || error.includes('already canceled') || error.includes('filled')) {
                        throw new OrderError(error);
                    }
                    // Default to OrderError for unknown cases
                    throw new OrderError(error);
                }
            }

            return response.data;
        } catch (error) {
            if (error instanceof MarginError || error instanceof PositionError || error instanceof OrderError) {
                throw error;
            }
            if (error instanceof AxiosError) {
                elizaLogger.error('Exchange API request failed:', error.response?.data || error.message);
                const errorData = error.response?.data;
                if (errorData) {
                    const errorMessage = errorData.message || errorData.error || error.message;
                    if (errorMessage.includes('margin')) {
                        throw new MarginError(errorMessage);
                    }
                    if (errorMessage.includes('position cap') || errorMessage.includes('open interest is at cap')) {
                        throw new PositionError(errorMessage);
                    }
                    if (errorMessage.includes('reduce only') || errorMessage.includes('would increase position')) {
                        throw new OrderError(errorMessage);
                    }
                    if (errorMessage.includes('never placed') || errorMessage.includes('already canceled') || errorMessage.includes('filled')) {
                        throw new OrderError(errorMessage);
                    }
                    if (errorMessage.includes('Invalid asset')) {
                        throw new OrderError(errorMessage);
                    }
                    throw new OrderError(errorMessage);
                }
                throw new OrderError(error.message);
            }
            elizaLogger.error('Unexpected error during exchange request:', error);
            throw new OrderError((error as Error).message);
        }
    }
}
