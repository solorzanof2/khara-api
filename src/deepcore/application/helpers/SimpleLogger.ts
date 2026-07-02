

export class SimpleLogger {

  private static readonly Color = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    foreground: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        gray: "\x1b[90m",
        crimson: "\x1b[38m" // Scarlet
    },
    background: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        gray: "\x1b[100m",
        crimson: "\x1b[48m"
    }
};

  static log(value: string): void {
    console.log(`[INF0] UNLABELED - `, value);
  }

  static customText(value: string, label: string = 'UNLABELED', severity: string = 'INF0'): void {
    console.log(`[${severity}] ${label} - ${value}`);
  }

  static info(value: string, label: string = 'UNLABELED', requestId: string = ''): void {
    // SimpleLogger.customText(value, label, 'INF0');
    console.log(`[INF0] ${requestId} | ${label} - ${value}`);
  }

  static nonSpaceInfoText(value: string, label: string = 'LABELED'): void {
    console.log(`[INF0] ${label} - ${value}`);
  }

  static warning(value: string, label: string = 'UNLABELED', requestId: string = ''): void {
    // SimpleLogger.customText(value, label, 'WARN');
    console.log(SimpleLogger.Color.foreground.yellow, `[WARN] ${requestId} | ${label} - ${value}`, SimpleLogger.Color.reset);
  }

  static error(value: string, label: string = 'UNLABELED', requestId: string = ''): void {
    // SimpleLogger.customText(value, label, 'ERR0');
    console.log(SimpleLogger.Color.foreground.red, `[ERR0] ${requestId} | ${label} - ${value}`, SimpleLogger.Color.reset);
  }

  static logAny(value: any, severity: string, label: string = 'UNLABELED', requestId: string = ''): void {
    SimpleLogger.customText(JSON.stringify(value), `${requestId} | ${label}`, severity);
  }

}

