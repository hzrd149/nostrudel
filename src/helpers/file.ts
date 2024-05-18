export const readFileAsArrayBuffer = async (file: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result == undefined || typeof result !== "object") {
        reject();

        return;
      }

      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
