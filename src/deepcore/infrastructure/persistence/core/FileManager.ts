import * as fileSystem from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Migration } from '../models/Migration';


export class FileManager {
  static readonly CHANGESET: string = '--changeset';
  static readonly PROCEDURE: string = '--pl';

  private basePath: string;
  private filesCollection: string[];
  private migrationsCollection: Migration[];

  constructor(basePath: string) {
    this.basePath = basePath;
    this.filesCollection = new Array<string>();
    this.migrationsCollection = new Array<Migration>();
  }

  scanMigrationPath(): Promise<void> {
    try {
      const collection = new Array<string>();

      for (const route of fileSystem.readdirSync(this.basePath)) {
        if (route.includes('.sql')) {
          collection.push(path.join(this.basePath, route));
        }
      }
      this.filesCollection = collection;
      return Promise.resolve();
    }
    catch (error: any) {
      return Promise.reject(new Error(error.message));
    }
  }

  parseMigrations(): Promise<void> {
    try {
      for (const route of this.filesCollection) {
        const fileContent = this.getFileContent(route);

        const linesCollection = fileContent.split('\n');

        let migration = new Migration();
        let queryBuilder = new Array<string>();

        for (const line of linesCollection) {
          let text = line.replace(/\r/g, '');

          if (!text) {
            continue;
          }

          if (!text.includes(FileManager.CHANGESET)) {
            queryBuilder.push(text.trim());
            if (migration.isProcedure) {
              continue;
            }

            if (text.endsWith(';')) {
              migration.queriesCollection.push(queryBuilder.join(' '));
              queryBuilder = new Array<string>();
            }

            continue;
          }

          const isProcedure = text.includes(FileManager.PROCEDURE);
          if (isProcedure && queryBuilder.length) {
            migration.queriesCollection.push(queryBuilder.join(' '));
          }

          if (migration.queriesCollection.length) {
            migration.signature = this.generateSignature(migration);
            migration.route = route;
            migration.rawContent = fileContent;

            this.migrationsCollection.push(migration);
            migration = new Migration();
          }

          if (isProcedure) {
            text = text.replace(FileManager.PROCEDURE, '');
            migration.isProcedure = isProcedure;
          }

          queryBuilder = new Array<string>();

          const info = text.replace(FileManager.CHANGESET, '').trim();
          const [author, title] = info.split(':');
          migration.author = author;
          migration.title = title;
          migration.changeset = text;
        }

        if (migration.isProcedure) {
          migration.queriesCollection.push(queryBuilder.join(' '));
        }

        migration.signature = this.generateSignature(migration);
        migration.route = route;
        migration.rawContent = fileContent;

        this.migrationsCollection.push(migration);
      }

      return Promise.resolve();
    }
    catch (error: any) {
      return Promise.reject(new Error(error.message));
    }
  }

  * getMigration(): Generator<Migration, void, unknown> {
    for (const migration of this.migrationsCollection) {
      yield migration;
    }
  }

  private getFileContent(path: string): string {
    try {
      return fileSystem.readFileSync(path).toString();
    }
    catch (error: any) {
      throw new Error(error.message);
    }
  }

  private generateSignature(migration: Migration): string {
    const data = new Array<string>();
    data.push(migration.changeset);
    for (const query of migration.queriesCollection) {
      data.push(query);
    }

    return crypto.createHash('md5').update(data.join(' ')).digest('hex');
  }

}