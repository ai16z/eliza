import {
    GeneralException,
    UnspecifiedErrorCode,
} from "@injectivelabs/exceptions";

export class GrpcException extends GeneralException {
    constructor(
        error: Error | string,
        public code = UnspecifiedErrorCode,
        public contextModule?: string
    ) {
        super(error instanceof Error ? error : new Error(error));
        this.name = "GrpcException";
    }

    public toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            contextModule: this.contextModule,
        };
    }
}
