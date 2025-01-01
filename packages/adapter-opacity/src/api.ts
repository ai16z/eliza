export async function generateProof(baseUrl: string, logId: string) {
    const response = await fetch(`${baseUrl}/api/logs/${logId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch proof: ${response.statusText}`);
    }
    return await response.json();
}

export async function verifyProof(baseUrl: string, tlsProof: string) {
    const response = await fetch(`${baseUrl}/api/verify`, {
        headers: {
            "Content-Type": "application/json",
        },
        body: tlsProof,
        method: "POST",
    });
    if (!response.ok) {
        throw new Error(`Failed to verify proof: ${response.statusText}`);
    }
    return await response.json();
}
