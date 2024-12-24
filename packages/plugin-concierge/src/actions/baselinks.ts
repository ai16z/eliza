export interface Frame {
    title: string;
    buttons: { content: string; action: string; target: string }[];
    image: string;
}

const framesUrl =
    process.env.BASELINKS_URL !== undefined
        ? process.env.BASELINKS_URL
        : "https://baselinks.vercel.app";

export class baselinks {
    static walletDetails(
        ownerAddress: string,
        agentAddress: string,
        balance: number
    ): string {
        const url = `${framesUrl}/wallet?agentAddress=${agentAddress}&ownerAddress=${ownerAddress}&balance=${balance}`;
        return url;
    }

    static coinbaseLink(address: string): string {
        const url = `${framesUrl}/coinbase?address=${address}`;
        return url;
    }

    static paymentLink(
        toAddress: string = "0x0000000000000000000000000000000000000000",
        amount: number = 0.01,
        onRampURL?: string
    ): string {
        let sendUrl = `${framesUrl}/payment?amount=${amount}&recipientAddress=${toAddress}`;
        if (onRampURL) {
            sendUrl = sendUrl + "&onRampURL=" + encodeURIComponent(onRampURL);
        }
        return sendUrl;
    }

    static receiptLink(txLink: string, amount: number): string {
        if (!txLink) return "";
        const receiptUrl = `${framesUrl}/receipt?txLink=${txLink}&amount=${amount}`;
        return receiptUrl;
    }

    static coinbaseDMLink(address: string, amount: number): string {
        const url = `${framesUrl}/coinbase?address=${address}&amount=${amount}`;
        return url;
    }

    static converseLink(peer: string, pretext?: string): string {
        let url = `https://converse.xyz/dm/${peer}`;
        if (pretext) url += `&pretext=${encodeURIComponent(pretext)}`;
        return url;
    }

    static converseGroupLink(groupId: string, pretext?: string): string {
        let url = `https://converse.xyz/group/${groupId}`;
        if (pretext) url += `&pretext=${encodeURIComponent(pretext)}`;
        return url;
    }

    static customFrame(frame: Frame): string {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(frame)) {
            params.append(
                key,
                typeof value === "object" ? JSON.stringify(value) : value
            );
        }

        const frameUrl = `${framesUrl}/custom?${params.toString()}`;
        return frameUrl;
    }
}
