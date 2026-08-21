/**
 * Generates an `ADMIN_USERS` entry for a staff login.
 *
 *   npm run admin:hash -- someone@kineticphysio.ca
 *
 * Prompts for the password rather than taking it as an argument, so it never
 * lands in shell history or in the process list where other users on the
 * machine can read it. Prints the `email:hash` line to paste into the
 * ADMIN_USERS environment variable in Vercel.
 */
import { createInterface } from "node:readline";
import { stdin, stdout, argv, exit } from "node:process";

import { hashPassword, parseAdminUsers } from "../lib/admin/password";

/** Reads a line with terminal echo suppressed, so the password isn't visible
 *  over someone's shoulder or in a screen share. */
function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });

    // readline writes the prompt itself; muting from the first write onwards
    // hides the typed characters without hiding the question.
    let muted = false;
    const write = stdout.write.bind(stdout);
    (rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput = (text) => {
      if (!muted) write(text);
    };

    rl.question(question, (answer) => {
      rl.close();
      write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const email = argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Usage: npm run admin:hash -- <email>");
    exit(1);
  }

  const password = await askHidden(`Password for ${email}: `);
  const confirmation = await askHidden("Confirm password: ");

  if (password !== confirmation) {
    console.error("\nThose didn't match. Nothing was generated.");
    exit(1);
  }

  // Not a policy so much as a floor. This password is the only thing between
  // the internet and the clinic's content, and it is typed rarely enough that
  // length costs little.
  if (password.length < 12) {
    console.error("\nUse at least 12 characters.");
    exit(1);
  }

  const entry = `${email}:${await hashPassword(password)}`;

  // Round-trips the result through the same parser the app uses, so a bad
  // entry is caught here rather than at someone's first failed login.
  if (parseAdminUsers(entry).length !== 1) {
    console.error("\nGenerated an entry the app wouldn't accept. This is a bug.");
    exit(1);
  }

  console.log("\nAdd this line to ADMIN_USERS (one entry per account):\n");
  console.log(entry);
  console.log(
    "\nIf ADMIN_USERS already has entries, separate them with a newline, comma or semicolon."
  );
}

main().catch((error) => {
  console.error(error);
  exit(1);
});
