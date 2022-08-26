import { Mail } from "../models/mail.model";

export interface MailsListDto {
    in: Mail[],
    out: Mail[],
}