/**
 * Copyright (C) 2017 Auralia
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {ArgumentParser} from "argparse";
import "es6-promise";
import * as fs from "fs";
import {NsApi} from "nsapi";
import {NsWeb} from "nsweb";
import * as os from "os";
import {createInterface, ReadLine} from "readline";
import * as util from "util";
import {log} from "winston";

/**
 * The current version of nslogin-cli.
 */
export const VERSION = "0.1.3";

/**
 * Represents a nation name and associated password.
 */
interface Credential {
    nation: string,
    password: string
}

const RESTORE_WARNING = "Please note that you will be asked to confirm each"
                        + " nation restoration. This is required to satisfy"
                        + " the 'one click per action' NationStates script"
                        + " rule for actions that affect parts of"
                        + " NationStates other than your own nation.";

/**
 * Initializes the CLI interface.
 */
export async function init(): Promise<void> {
    let verbose = true;
    try {
        const args = parseArgs();
        verbose = args.verbose;

        log("info", `nslogin-cli ${VERSION}`);

        let credentials: Credential[] | null =
            await getCredentials(args.path, args.encoding);
        if (credentials === null) {
            return;
        }

        const api = new NsApi(args.userAgent);
        const web = new NsWeb(args.userAgent);
        try {
            if (args.mode === "auto") {
                log("info", "Auto mode");
                log("info", RESTORE_WARNING);
                await auto(api, web, credentials, verbose);
            } else if (args.mode === "login") {
                log("info", "Login mode");
                await loginNations(api, credentials, verbose);
            } else if (args.mode === "restore") {
                log("info", "Restore mode");
                log("info", RESTORE_WARNING);
                await restoreNations(web, credentials, verbose);
            } else {
                log("error", "Unrecognized mode");
            }
        }
        finally {
            api.cleanup();
            web.cleanup();
        }
    } catch (err) {
        log("error", "Unknown error occurred");
        if (verbose) {
            log("error", util.inspect(err));
        }
    }
}

/**
 * Opens the CSV file at the specified path using the specified encoding
 * and returns the nations and passwords in that file.
 *
 * @param path The specified path.
 * @param encoding The specified file encoding, as required by the Node.js
 *                 filesystem API.
 *
 * @return A promise returning the credentials in the file, or null if an error
 *         occurred.
 */
async function getCredentials(path: string,
                              encoding: string): Promise<Credential[] | null> {

    const text = await readFile(path, encoding);
    const credentials: Credential[] = [];
    const lines = text.split(os.EOL);
    for (let i = 0; i < lines.length; i++) {
        // Ignore empty lines or lines just containing whitespace
        if (lines[i].trim() === "") {
            continue;
        }
        const tuple = lines[i].split(",");
        if (tuple.length !== 2) {
            log("error", `CSV file does not contain a single nation and`
                         + ` a single password in the form 'nation,password'`
                         + ` on line ${i}`);
            return null;
        }
        credentials.push({nation: tuple[0], password: tuple[1]});
    }
    if (credentials.length === 0) {
        log("error", "No nations and passwords in CSV file");
        return null;
    }
    return credentials;
}

/**
 * Logs into or restores the nations given by the specified credentials
 * depending on whether they currently exist.
 *
 * @param api The NsApi instance to use.
 * @param web The NsWeb instance to use.
 * @param credentials The names and passwords of the nations to log into or
 *                    restore.
 * @param verbose Whether or not to print out detailed error messages.
 */
async function auto(api: NsApi, web: NsWeb, credentials: Credential[],
                    verbose: boolean): Promise<void> {
    for (const credential of credentials) {
        let login = true;
        try {
            log("info", `${credential.nation}: Nation exists`);
            await api.nationRequest(credential.nation, ["name"]);
        } catch (_) {
            log("info", `${credential.nation}: Nation does not exist`);
            login = false;
        }
        if (login) {
            await loginNations(api, [credential], verbose);
        } else {
            await restoreNations(web, [credential], verbose);
        }
    }
}

/**
 * Logs into the nations given by the specified credentials.
 *
 * @param api The NsApi instance to use.
 * @param credentials The specified credentials.
 * @param verbose Whether error messages should be printed out.
 */
async function loginNations(api: NsApi,
                            credentials: Credential[],
                            verbose: boolean): Promise<void> {
    for (const credential of credentials) {
        try {
            await api.nationRequest(credential.nation, ["notices"],
                                    undefined, {password: credential.password});
            log("info", `${credential.nation}: Login successful`);
        } catch (err) {
            log("error", `${credential.nation}: Login failed`);
            if (verbose) {
                log("error", util.inspect(err));
            }
        }
    }
}

/**
 * Restores the nations given by the specified credentials.
 *
 * @param web The NsWeb instance to use.
 * @param credentials The specified credentials.
 * @param verbose Whether error messages should be printed out.
 */
async function restoreNations(web: NsWeb,
                              credentials: Credential[],
                              verbose: boolean): Promise<void> {
    const readLine = createInterface({
                                         input: process.stdin,
                                         output: process.stdout
                                     });
    try {
        for (const credential of credentials) {
            await question(readLine, `Press the ENTER key to restore`
                                     + ` ${credential.nation}...`);
            try {
                await web.restoreRequest(credential.nation,
                                         credential.password);
                log("info", `${credential.nation}: Restore successful`);
            } catch (err) {
                log("error", `${credential.nation}: Restore failed`);
                if (verbose) {
                    log("error", util.inspect(err));
                }
            }
        }
    } finally {
        readLine.close();
    }
}

/**
 * Reads the file at the specified path with the specified encoding.
 *
 * @param path The specified path.
 * @param encoding The specified encoding.
 * @return A promise returning the contents of the file.
 */
function readFile(path: string, encoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, encoding, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
}

/**
 * Asks a question on stdout and returns the answer from stdin.
 *
 * @param readLine An instance of ReadLine pointing to stdout and stdin.
 * @param message The question to ask.
 * @return A promise returning the answer.
 */
function question(readLine: ReadLine, message: string): Promise<string> {
    return new Promise((resolve) => {
        readLine.question(message, (response) => {
            resolve(response);
        });
    });
}

/**
 * Parse the command line arguments given to the application.
 *
 * @return An object containing the command line arguments.
 */
function parseArgs(): any {
    const parser = new ArgumentParser({
        version: VERSION,
        description: "CLI for logging into and restoring NationStates nations."
    });

    parser.addArgument(["--mode"], {
        choices: ["login", "restore", "auto"],
        defaultValue: "auto",
        help: "Whether to log into nations, restore nations, or automatically"
              + " log into or restore nations depending on whether they exist."
              + " The valid options are 'login', 'restore', and 'auto'."
              + " Defaults to 'auto'.",
        metavar: "MODE"
    });
    parser.addArgument(["--encoding"], {
        defaultValue: "utf8",
        help: "The encoding of the CSV file. Required by the Node.js file"
              + " system API. Defaults to 'utf8'.",
        metavar: "ENCODING"
    });
    parser.addArgument(["--verbose"], {
        action: "storeTrue",
        help: "Show detailed error output. This is disabled by default."
    });

    parser.addArgument(["userAgent"], {
        help: "A string identifying you to the NationStates API. Using the"
              + " name of your main nation is recommended."
    });
    parser.addArgument(["path"], {
        help: "The path to a CSV file listing nations and their associated"
              + " passwords in the form 'nation,password', one per line. Each"
              + " nation in the list will be logged into or restored, depending"
              + " on the mode."
    });

    return parser.parseArgs();
}
