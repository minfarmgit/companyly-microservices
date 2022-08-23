// @ts-ignore
import { SMTPServer, SMTPServerDataStream, SMTPServerSession } from 'smtp-server';
// @ts-ignore
import { ParsedMail, simpleParser } from "mailparser";
import { environment } from "./env";

const server: SMTPServer = new SMTPServer({
    onData(stream: SMTPServerDataStream, session: SMTPServerSession, callback: any) {
        simpleParser(stream, {}, (err: any, parsed: ParsedMail) => {
            if (err)
                console.log("Error:" , err)

            console.log(parsed)
            stream.on("end", callback)
        });

    },
    disabledCommands: ['AUTH']
});

server.listen(environment.emailPort, environment.emailHost, () => {
    console.log(`[Email] Server listening at port ${environment.emailPort}`);
});