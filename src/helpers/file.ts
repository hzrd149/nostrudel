export const readFileAsArrayBuffer = async (file: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result == undefined || typeof result !== "object") return reject();

      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });

export const readFileAsText = async (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result == undefined || typeof result !== "string") return reject();

      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
