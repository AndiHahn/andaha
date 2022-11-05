export function fileDataUriToBlob(base64DataUri: string): Blob {
  const byteString = window.atob(base64DataUri);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const int8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    int8Array[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([int8Array], { type: 'image/png' });  

  return blob;
}

export function imageBlobToFile(blob: Blob, imageName: string = "image"): File {
  return new File([blob], imageName, { type: 'image/png' });
}

export async function blobToDataUrl(blob: Blob | undefined): Promise<string | undefined> {
  if (blob == undefined) {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBase64(dataUrl: string): string {
  const dataUrlPrefix = "data:image/jpeg;base64,";

  const index = dataUrl.indexOf(dataUrlPrefix);
  if (index > 0) {
    return dataUrl.substring(dataUrlPrefix.length - 1);
  }

  return dataUrl;
}
