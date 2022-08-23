import { SMTPServer } from 'smtp-server';
import { simpleParser } from "mailparser";
import { environment } from "./env";

const server = new SMTPServer({
    onData(stream, session, callback) {
        simpleParser(stream, {}, (err, parsed) => {
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