import tls from "tls";

type SendMailOptions = {
    to: string;
    subject: string;
    text: string;
};

function readResponse(socket: tls.TLSSocket) {
    return new Promise<string>((resolve, reject) => {
        let buffer = "";

        const handleData = (chunk: Buffer) => {
            buffer += chunk.toString("utf8");
            const lines = buffer.split(/\r?\n/).filter(Boolean);
            const lastLine = lines[lines.length - 1] || "";

            if (/^\d{3} /.test(lastLine)) {
                socket.off("data", handleData);
                socket.off("error", reject);
                resolve(buffer);
            }
        };

        socket.on("data", handleData);
        socket.once("error", reject);
    });
}

async function sendCommand(socket: tls.TLSSocket, command: string) {
    socket.write(`${command}\r\n`);
    const response = await readResponse(socket);
    const code = Number(response.slice(0, 3));

    if (code >= 400) {
        throw new Error(`SMTP command failed: ${response.trim()}`);
    }

    return response;
}

function encodeHeader(value: string) {
    return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function dotStuff(value: string) {
    return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

export async function sendMail({ to, subject, text }: SendMailOptions) {
    const user = process.env.GMAIL_SMTP_USER;
    const password = process.env.GMAIL_SMTP_APP_PASSWORD;
    const fromName = process.env.MAIL_FROM_NAME || "C&C Web Menu";

    if (!user || !password) {
        throw new Error(
            "GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD are required."
        );
    }

    const socket = tls.connect({
        host: "smtp.gmail.com",
        port: 465,
        servername: "smtp.gmail.com",
    });

    try {
        await new Promise<void>((resolve, reject) => {
            socket.once("secureConnect", resolve);
            socket.once("error", reject);
        });

        await readResponse(socket);
        await sendCommand(socket, "EHLO cc-web-menu.local");
        await sendCommand(socket, "AUTH LOGIN");
        await sendCommand(socket, Buffer.from(user).toString("base64"));
        await sendCommand(socket, Buffer.from(password).toString("base64"));
        await sendCommand(socket, `MAIL FROM:<${user}>`);
        await sendCommand(socket, `RCPT TO:<${to}>`);
        await sendCommand(socket, "DATA");

        const message = [
            `From: ${encodeHeader(fromName)} <${user}>`,
            `To: <${to}>`,
            `Subject: ${encodeHeader(subject)}`,
            "MIME-Version: 1.0",
            "Content-Type: text/plain; charset=UTF-8",
            "Content-Transfer-Encoding: 8bit",
            "",
            dotStuff(text),
            ".",
        ].join("\r\n");

        await sendCommand(socket, message);
        await sendCommand(socket, "QUIT");
    } finally {
        socket.destroy();
    }
}
