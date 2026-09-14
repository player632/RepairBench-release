export const downloadBlob = (blob: Blob, filename: string) : void => {
  // Repair-Bench instrumentation: record exports for checkpoint assertions.
  const rb = (window as unknown as Record<string, unknown>)['__rb'] as
    { exports?: { filename: string; type: string; size: number; blob: Blob }[] } | undefined;
  rb?.exports?.push({ filename, type: blob.type, size: blob.size, blob });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; // eslint-disable-line functional/immutable-data
  link.download = filename; // eslint-disable-line functional/immutable-data
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
