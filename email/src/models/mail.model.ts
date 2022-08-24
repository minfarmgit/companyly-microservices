import { AddressObject, Attachment } from "mailparser";

export interface Mail {
    attachments: Attachment[],
    from: AddressObject | undefined;
    to: AddressObject | AddressObject[] | undefined
    subject: string | undefined;
    date: Date | undefined;
    content: {
        text: string | undefined;
        html: string | false;
    }
}