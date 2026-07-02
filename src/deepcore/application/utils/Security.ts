import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import EC from 'elliptic';
import { v4 as uuidv4 } from 'uuid';


export class Security {
  static readonly JWTSecretKey = '3adf31d02519c02e3181f57ddaf042321a3060f65e94a60806c076593346f4a1';
  static readonly Hexadecimal = 'hex';
  static readonly Base64 = 'base64';
  static readonly Sha256 = 'sha256';
  static readonly Sha512 = 'sha512';

  static getRandomGUID(size: number = 12): string {
    const charsCollection = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charsLength = charsCollection.length;

    let hash = '';
    let index = 0;
    for (index; index < size; index++) {
      hash += charsCollection[Math.floor(Math.random() * charsLength)];
    }

    return hash;
  }

  static getUUID(): string {
    return uuidv4();
  }

  static getJSONWebTokenByData(value: any): string {
    return jwt.sign(value, Security.JWTSecretKey);
  }

  static async validateJSONWebToken<T>(value: string): Promise<T> {
    return new Promise((resolve, reject) => {
      jwt.verify(value, Security.JWTSecretKey, (error, response) => {
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve(response as T);
      });
    });
  }

  static getKeys(): KeyPair {
    const ec =  Security.getECInstance();
    const key = ec.genKeyPair();

    return {
      key,
      publicKey: key.getPublic(Security.Hexadecimal),
      privateKey: key.getPrivate(Security.Hexadecimal),
    } as KeyPair;
  }

  static getKeyFromPrivate(value: string): KeyPair {
    const ec =  Security.getECInstance();
    const key = ec.keyFromPrivate(value);

    return {
      key,
      publicKey: key.getPublic(Security.Hexadecimal),
      privateKey: key.getPrivate(Security.Hexadecimal),
    } as KeyPair;
  }

  static keySignature(hash: string, signingKey: any): string {
    const sign = signingKey.sign(hash, Security.Base64);
    return sign.toDER(Security.Hexadecimal);
  }

  static validateSignature(publicKey: string, hash: string, signature: string): boolean {
    const ec = Security.getECInstance();
    const key = ec.keyFromPublic(publicKey, Security.Hexadecimal);
    return key.verify(hash, signature);
  }

  static getPasswordHash(value: string): string {
    return bcrypt.hashSync(value, 8);
  }

  static validatePassword(value: string, storedPassword: string): boolean {
    return bcrypt.compareSync(value, storedPassword);
  }

  static calculateHashByValue(value: string): string {
    return crypto.createHash(Security.Sha256).update(value).digest(Security.Hexadecimal);
  }
  static calculateHashSha512ByValue(value: string): string {
    return crypto.createHash(Security.Sha512).update(value).digest(Security.Hexadecimal);
  }

  private static getECInstance(): any {
    return new EC.ec('secp256k1');
  }

  static toBase64(value: string): string {
    return Buffer.from(value).toString(Security.Base64);
  }

  static fromBase64(value: string): string {
    return Buffer.from(value, Security.Base64).toString('ascii');
  }

  static createSlug(value: string, joiner: string = '-'): string {
    return value.toLowerCase().split(' ').join(joiner);
  }
}

interface KeyPair {
  key: any;
  publicKey: string;
  privateKey: string;
}