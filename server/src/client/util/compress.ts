// Compress JSON data
// export async function compressJSON(data: any): Promise<Uint8Array> {
//   try {
//     if (typeof CompressionStream === "undefined") {
//       throw new Error("CompressionStream is not supported in this environment");
//     }

//     const jsonBlob = new Blob([JSON.stringify(data)], {
//       type: "application/json",
//     });
//     const stream = jsonBlob.stream();
//     const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
//     const compressedResponse = new Response(compressedStream);
//     const compressedArrayBuffer = await compressedResponse.arrayBuffer();
//     return new Uint8Array(compressedArrayBuffer);
//   } catch (error) {
//     console.error("Error compressing JSON:", error);
//     throw error;
//   }
// }

export async function compressJSON(data: any): Promise<Uint8Array> {
  try {
    if (typeof CompressionStream === "undefined") {
      throw new Error("CompressionStream is not supported in this environment");
    }

    const jsonString = JSON.stringify(data);
    const originalSize = new TextEncoder().encode(jsonString).length;

    const jsonBlob = new Blob([jsonString], { type: "application/json" });
    const stream = jsonBlob.stream();
    const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
    const compressedResponse = new Response(compressedStream);
    const compressedArrayBuffer = await compressedResponse.arrayBuffer();
    const compressedData = new Uint8Array(compressedArrayBuffer);

    const compressedSize = compressedData.length;
    const compressionRatio = (compressedSize / originalSize) * 100;

    // console.log(`compression ratio: ${compressionRatio} [${originalSize} > ${compressedSize}]`)
    return compressedData;
  } catch (error) {
    console.error("Error compressing JSON:", error);
    throw error;
  }
}

// Decompress JSON data
export async function decompressJSON(compressedData: Uint8Array): Promise<any> {
  try {
    if (typeof DecompressionStream === "undefined") {
      throw new Error(
        "DecompressionStream is not supported in this environment"
      );
    }

    const compressedStream = new ReadableStream({
      start(controller) {
        controller.enqueue(compressedData);
        controller.close();
      },
    });
    const decompressedStream = compressedStream.pipeThrough(
      new DecompressionStream("gzip")
    );
    const decompressedResponse = new Response(decompressedStream);
    const jsonString = await decompressedResponse.text();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error decompressing JSON:", error);
    throw error;
  }
}
