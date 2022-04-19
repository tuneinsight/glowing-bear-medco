import { CipherFormat } from "@tuneinsight/geco-cryptolib";

export const isCipherFormat = (obj: CipherFormat | Error): obj is CipherFormat => {
    return (obj as CipherFormat).data !== undefined;
  }