export function constructPath(...urlParts: string[]): string {
  if (urlParts.length === 0) {
    return '';
  }
  let finalPath = ensureStringEndsWithSlash(urlParts[0]) || '';
  for (let i = 1; i < urlParts.length; i++) {
    const part = ensureStringEndsWithSlash(urlParts[i]);
    if (urlParts[i].startsWith('/')) {
      finalPath += part.substr(1);
    } else {
      finalPath += part;
    }
  }
  // To remove the last slash
  return finalPath.substr(0, finalPath.length - 1);
}

export function constructVersionedPath(apiVersion: string, ...urlParts: string[]): string {
  const path = constructPath(...urlParts);

  const apiVersionParameter = "api-version=" + apiVersion;
  
  if (path.includes('?')) {
    return path + "&" + apiVersionParameter;
  }

  return path + "?" + apiVersionParameter;
}

function ensureStringEndsWithSlash(value: string): string {
  if (value.endsWith('/')) {
    return value;
  }
  return (value += '/');
}
