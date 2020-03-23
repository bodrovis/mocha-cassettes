declare module 'mocha-cassettes' {
	export type RegistrationOptions = {
	  failIfNoCassette: boolean;
	};

	export interface ICompilable {
	  register(suite: any, options?: RegistrationOptions): void;
	  timeout(n: number | string): ICompilable;
	}

	export interface IRecordable {
	  recordCassette(cassetteFileName?: string): ICompilable;
	}

	export function TestVcr(cassettePath: string, title: string, fn?: mocha.Func | mocha.AsyncFunc): MochaVcr;


	export class Vcr {
	  private cassettePath: string;
	  constructor(cassettePath: string);
	  public createTest(title: string, fn?: mocha.Func | mocha.AsyncFunc): MochaVcr;
	  public removeAllCassettes(): Promise<void>;
	}


	export class MochaVcr extends mocha.Test implements ICompilable, IRecordable, IPlayable {
	  private cassettePath: string;
	  private fnPrefix: () => void;
	  private fnSuffix: () => void;
	  private actionSpecified: boolean;

	  constructor(cassettePath: string, title: string, fn?: mocha.Func | mocha.AsyncFunc);
	  public recordCassette(cassetteFileName?: string): ICompilable;
	  public playCassette(cassetteFileName?: string): ICompilable;
	  public selectCassetteAction(fn: () => 'record' | 'play', cassettePath?: string): ICompilable;
	  public register(suite: mocha.Suite,  options: RegistrationOptions = { failIfNoCassette: false}): void;
	  private resetNock();
	  private cassetteExists(filePath: string): boolean;
	  private getCassetteFilePath(filename?: string): string;
	  private getCassetteName(filename?: string): string;
	}

}
