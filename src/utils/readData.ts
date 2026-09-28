import { readFile } from "fs/promises";

export const readData = async (filePath: string) => {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data || '[]');
}